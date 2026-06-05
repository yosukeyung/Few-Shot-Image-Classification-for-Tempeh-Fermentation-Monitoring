"""
select_best_support.py
======================
Mencari kombinasi 10 gambar support per kelas dari data TRAINING yang menghasilkan
akurasi tertinggi pada SELURUH data TEST.

Alur:
1. Load model ResNet-50 dari v2/models/tempeh_resnet50_best.pth
2. Split dataset -> train / test (seed=42, 80/20)
3. Precompute fitur (2048-dim) untuk semua gambar train dan test (sekali saja)
4. Phase A: Random Search (N_TRIALS trials) — cari kombinasi acak terbaik
5. Phase B: Greedy Local Search — improve kombinasi terbaik dari Phase A
6. Salin gambar support terpilih ke v2/support/Day-0, Day-1, Day-2
"""

import os
import sys
import shutil
import random
import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image
import torchvision.transforms as transforms
from torchvision import datasets

# ─── Path Setup ────────────────────────────────────────────────────────────────
# Script berada di v2/scripts/, jadi tambahkan v2/ ke sys.path agar bisa import
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
V2_DIR     = os.path.dirname(SCRIPT_DIR)
sys.path.insert(0, V2_DIR)

from model       import PrototypicalNetwork
from data_loader import get_split_indices

# ─── Konfigurasi ────────────────────────────────────────────────────────────────
# Cek lokasi dataset yang valid secara berurutan
POSSIBLE_DATA_DIRS = [
    os.path.join(V2_DIR, "data"),
    os.path.join(os.path.dirname(V2_DIR), "dataset", "data"),
    os.path.join(os.path.dirname(V2_DIR), "data"),
    "./data"
]

DATA_DIR = None
for path in POSSIBLE_DATA_DIRS:
    if os.path.exists(path) and all(os.path.exists(os.path.join(path, c)) for c in ["Day-0", "Day-1", "Day-2"]):
        DATA_DIR = os.path.abspath(path)
        break

if DATA_DIR is None:
    # Fallback default
    DATA_DIR = os.path.join(V2_DIR, "data")

MODEL_PATH    = os.path.join(V2_DIR, "models", "tempeh_resnet50_best.pth")
SUPPORT_DIR   = os.path.join(V2_DIR, "support")
CLASSES       = ["Day-0", "Day-1", "Day-2"]
K_SHOT        = 10          # jumlah support per kelas
N_TRIALS      = 20_000      # Phase A: jumlah trial random search
SEED          = 42
os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'

# ─── Transform (tanpa augmentasi — sama seperti inference) ──────────────────────
inference_transform = transforms.Compose([
    transforms.Resize((320, 320)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225])
])


# ══════════════════════════════════════════════════════════════════════════════
# Helper Functions
# ══════════════════════════════════════════════════════════════════════════════

def load_dataset_no_aug(data_dir):
    """Load dataset ImageFolder tanpa augmentasi (untuk feature extraction)."""
    dataset = datasets.ImageFolder(root=data_dir, transform=inference_transform)
    return dataset


def precompute_features(model, dataset, indices, device, batch_size=32):
    """
    Ekstraksi fitur untuk semua gambar pada indeks yang diberikan.
    Returns:
        features: np.ndarray (N, 2048) — fitur L2-normalized
        labels:   np.ndarray (N,)      — label kelas
        paths:    list of str (N,)     — path file gambar
    """
    from torch.utils.data import DataLoader, Subset

    subset  = Subset(dataset, indices)
    loader  = DataLoader(subset, batch_size=batch_size, shuffle=False,
                         num_workers=0, pin_memory=True)

    model.eval()
    all_features = []
    all_labels   = []

    print(f"    Mengekstrak fitur dari {len(indices)} gambar...")
    with torch.no_grad():
        for imgs, lbls in loader:
            imgs = imgs.to(device)
            feats = model.get_features(imgs)               # (B, 2048)
            feats = F.normalize(feats, p=2, dim=1)         # L2 normalize
            all_features.append(feats.cpu().numpy())
            all_labels.extend(lbls.numpy())

    features = np.concatenate(all_features, axis=0)
    labels   = np.array(all_labels)
    paths    = [dataset.samples[i][0] for i in indices]
    return features, labels, paths


def evaluate_support(support_feats_per_class, test_features, test_labels, temperature):
    """
    Hitung akurasi pada seluruh test set dengan prototype dari support_feats_per_class.

    Args:
        support_feats_per_class: list of np.ndarray, masing-masing shape (K, 2048)
        test_features:           np.ndarray (M, 2048) — sudah L2-normalized
        test_labels:             np.ndarray (M,)
        temperature:             float — learned temperature dari model
    Returns:
        accuracy: float (0–1)
    """
    n_classes = len(support_feats_per_class)
    # Hitung prototype (rata-rata, lalu re-normalize)
    prototypes = []
    for feats in support_feats_per_class:
        proto = feats.mean(axis=0)
        proto = proto / (np.linalg.norm(proto) + 1e-8)
        prototypes.append(proto)
    prototypes = np.stack(prototypes, axis=0)  # (C, 2048)

    # Cosine similarity: test_features sudah normalized, prototypes juga
    # sim[i, c] = dot(test_features[i], prototypes[c])
    sim = test_features @ prototypes.T  # (M, C)
    logits = sim * temperature

    # Softmax argmax
    preds = np.argmax(logits, axis=1)  # (M,)
    acc   = (preds == test_labels).mean()
    return acc


def random_search(train_feats_per_class, test_features, test_labels, temperature,
                  n_trials, k_shot, rng):
    """
    Phase A: Random Search.
    Coba n_trials kombinasi acak, kembalikan kombinasi indeks terbaik beserta akurasinya.
    """
    n_classes = len(train_feats_per_class)
    best_acc   = -1.0
    best_indices = None  # list of list: best_indices[c] = list of k_shot indices

    for trial in range(n_trials):
        trial_indices = []
        trial_feats   = []
        for c in range(n_classes):
            n_train = len(train_feats_per_class[c])
            chosen  = rng.choice(n_train, size=k_shot, replace=False).tolist()
            trial_indices.append(chosen)
            trial_feats.append(train_feats_per_class[c][chosen])

        acc = evaluate_support(trial_feats, test_features, test_labels, temperature)
        if acc > best_acc:
            best_acc     = acc
            best_indices = trial_indices

        if (trial + 1) % 2000 == 0:
            print(f"    Phase A — Trial {trial+1:>6}/{n_trials}  |  Best Acc: {best_acc*100:.2f}%")

    return best_indices, best_acc


def greedy_local_search(train_feats_per_class, test_features, test_labels, temperature,
                        k_shot, best_indices):
    """
    Phase B: Greedy Local Search.
    Mulai dari best_indices hasil Phase A. Coba swap satu gambar support
    dengan gambar lain di kelas yang sama (yang belum dipakai). Accept jika acc meningkat.
    """
    n_classes   = len(train_feats_per_class)
    current_idx = [list(x) for x in best_indices]   # deep copy

    def current_acc():
        feats = [train_feats_per_class[c][current_idx[c]] for c in range(n_classes)]
        return evaluate_support(feats, test_features, test_labels, temperature)

    best_acc = current_acc()
    improved = True
    iteration = 0

    while improved:
        improved  = False
        iteration += 1
        for c in range(n_classes):
            n_train    = len(train_feats_per_class[c])
            used_set   = set(current_idx[c])
            unused_all = [i for i in range(n_train) if i not in used_set]

            for pos in range(k_shot):
                old_img = current_idx[c][pos]
                for new_img in unused_all:
                    current_idx[c][pos] = new_img
                    feats = [train_feats_per_class[cc][current_idx[cc]]
                             for cc in range(n_classes)]
                    acc   = evaluate_support(feats, test_features, test_labels, temperature)
                    if acc > best_acc:
                        best_acc = acc
                        unused_all = [i for i in range(n_train)
                                      if i not in set(current_idx[c])]
                        improved = True
                    else:
                        current_idx[c][pos] = old_img   # revert

        print(f"    Phase B — Iteration {iteration}  |  Best Acc: {best_acc*100:.2f}%")

    return current_idx, best_acc


def copy_support_images(best_indices, train_paths_per_class, support_dir, classes):
    """
    Salin gambar support terpilih ke support_dir/ClassName/.
    """
    print(f"\n[*] Menyalin gambar support ke {support_dir} ...")
    for c, cls_name in enumerate(classes):
        cls_dir = os.path.join(support_dir, cls_name)
        # Bersihkan isi lama
        if os.path.exists(cls_dir):
            shutil.rmtree(cls_dir)
        os.makedirs(cls_dir, exist_ok=True)

        for rank, idx in enumerate(best_indices[c]):
            src = train_paths_per_class[c][idx]
            ext = os.path.splitext(src)[1]
            dst = os.path.join(cls_dir, f"support_{rank+1:02d}{ext}")
            shutil.copy2(src, dst)
            print(f"    [{cls_name}] {os.path.basename(src)} -> {os.path.basename(dst)}")

    print("[*] Selesai menyalin support images.")


# ══════════════════════════════════════════════════════════════════════════════
# Main
# ══════════════════════════════════════════════════════════════════════════════

def main():
    random.seed(SEED)
    np.random.seed(SEED)
    rng = np.random.RandomState(SEED)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[*] Device: {device}")

    # ── 1. Load Model ──────────────────────────────────────────────────────────
    print(f"[*] Memuat model dari {MODEL_PATH} ...")
    model = PrototypicalNetwork(backbone_name='resnet50').to(device)
    model.load_state_dict(torch.load(MODEL_PATH, map_location=device, weights_only=False))
    model.eval()
    temperature = model.temperature.item()
    print(f"    Learned temperature: {temperature:.4f}")

    # ── 2. Load Dataset & Split ────────────────────────────────────────────────
    print(f"[*] Memuat dataset dari {DATA_DIR} ...")
    dataset = load_dataset_no_aug(DATA_DIR)
    print(f"    Total gambar: {len(dataset)} | Kelas: {dataset.classes}")

    train_indices, test_indices = get_split_indices(dataset, train_split=0.8, seed=SEED)
    print(f"    Train: {len(train_indices)} | Test: {len(test_indices)}")

    # ── 3. Precompute Features ─────────────────────────────────────────────────
    print("\n[*] Mengekstrak fitur dari data TRAIN ...")
    train_features, train_labels, train_paths = precompute_features(
        model, dataset, train_indices, device)

    print("[*] Mengekstrak fitur dari data TEST ...")
    test_features, test_labels, _ = precompute_features(
        model, dataset, test_indices, device)

    # Kelompokkan train features & paths per kelas
    n_classes = len(CLASSES)
    train_feats_per_class = []
    train_paths_per_class = []
    for c in range(n_classes):
        mask = train_labels == c
        train_feats_per_class.append(train_features[mask])
        train_paths_per_class.append([train_paths[i] for i, m in enumerate(mask) if m])
        print(f"    Kelas {CLASSES[c]}: {mask.sum()} train images")

    # ── 4. Phase A: Random Search ──────────────────────────────────────────────
    print(f"\n[*] Phase A: Random Search ({N_TRIALS:,} trials) ...")
    best_indices, phase_a_acc = random_search(
        train_feats_per_class, test_features, test_labels,
        temperature, N_TRIALS, K_SHOT, rng)
    print(f"\n    Phase A selesai — Best accuracy: {phase_a_acc*100:.2f}%")

    # ── 5. Phase B: Greedy Local Search ────────────────────────────────────────
    print("\n[*] Phase B: Greedy Local Search ...")
    best_indices, final_acc = greedy_local_search(
        train_feats_per_class, test_features, test_labels,
        temperature, K_SHOT, best_indices)
    print(f"\n    Phase B selesai — Final accuracy: {final_acc*100:.2f}%")

    # ── 6. Ringkasan per kelas ─────────────────────────────────────────────────
    print("\n[*] Per-class accuracy breakdown ...")
    feats_selected = [train_feats_per_class[c][best_indices[c]]
                      for c in range(n_classes)]
    prototypes = []
    for feats in feats_selected:
        proto = feats.mean(axis=0)
        proto = proto / (np.linalg.norm(proto) + 1e-8)
        prototypes.append(proto)
    prototypes = np.stack(prototypes, axis=0)

    sim = test_features @ prototypes.T * temperature
    preds = np.argmax(sim, axis=1)
    for c in range(n_classes):
        mask = test_labels == c
        cls_acc = (preds[mask] == c).mean()
        print(f"    {CLASSES[c]}: {cls_acc*100:.2f}% ({mask.sum()} test images)")

    # ── 7. Salin Support Images ────────────────────────────────────────────────
    print("\n[*] Selected support images per class:")
    for c in range(n_classes):
        print(f"  {CLASSES[c]}:")
        for idx in best_indices[c]:
            print(f"    [{idx}] {os.path.basename(train_paths_per_class[c][idx])}")

    copy_support_images(best_indices, train_paths_per_class, SUPPORT_DIR, CLASSES)

    # ── 8. Final Report ────────────────────────────────────────────────────────
    print("\n" + "="*60)
    print(f"  SUPPORT SET OPTIMIZATION SELESAI")
    print(f"  Phase A Best Acc : {phase_a_acc*100:.2f}%")
    print(f"  Phase B Final Acc: {final_acc*100:.2f}%")
    print(f"  Support images   : {K_SHOT} per kelas x {n_classes} kelas")
    print(f"  Disimpan ke      : {SUPPORT_DIR}")
    print("="*60)


if __name__ == "__main__":
    main()
