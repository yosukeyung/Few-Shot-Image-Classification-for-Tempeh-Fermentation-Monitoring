import os
import torch
import torch.nn.functional as F
from torch.utils.data import DataLoader, Subset
from torchvision import transforms
from PIL import Image

from data_loader import get_tempeh_dataset, get_split_indices
from model import PrototypicalNetwork

def get_prototypes_from_support(model, support_dir, transform, device):
    """
    Menghitung Prototypes/Centroids dari gambar di dalam folder support/
    """
    classes = ['Day-0', 'Day-1', 'Day-2']
    prototypes = []
    
    print("[*] Mengekstrak fitur dari folder support/ ...")
    model.eval()
    with torch.no_grad():
        for c in classes:
            class_dir = os.path.join(support_dir, c)
            imgs = []
            
            # Cek apakah folder kelas ada
            if not os.path.exists(class_dir):
                raise FileNotFoundError(f"[!] Folder {class_dir} tidak ditemukan!")
                
            # Load semua gambar di dalam folder kelas tersebut
            for img_name in os.listdir(class_dir):
                if img_name.lower().endswith(('.jpg', '.jpeg', '.png')):
                    img_path = os.path.join(class_dir, img_name)
                    img = Image.open(img_path).convert('RGB')
                    imgs.append(transform(img))
            
            if not imgs:
                raise ValueError(f"[!] Folder {class_dir} kosong! Masukkan minimal 1 gambar.")
                
            print(f"    -> {c}: Ditemukan {len(imgs)} gambar support.")
            
            # Ubah ke tensor dan ekstrak fitur
            imgs_tensor = torch.stack(imgs).to(device)
            features = model.get_features(imgs_tensor) # Output: (Jumlah Gambar, 2048)
            
            # Hitung rata-rata untuk menjadikannya Prototype (Centroid)
            proto = features.mean(dim=0)
            prototypes.append(proto)
            
    # Gabungkan menjadi tensor (3, 2048)
    return torch.stack(prototypes), classes

def test_with_fixed_support():
    # --- KONFIGURASI ---
    DATA_DIR = "./data"                 # Dataset asli (untuk query/ujian)
    SUPPORT_DIR = "./support"           # Folder referensi buatanmu
    MODEL_PATH = "models/tempeh_resnet50_best.pth"
    BATCH_SIZE = 32                     # Ukuran batch untuk mempercepat pengujian

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[*] Menggunakan device: {device}")

    # 1. Transformasi Gambar (Sesuai saat training)
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    # 2. Load Model ResNet-50
    model = PrototypicalNetwork(backbone_name='resnet50').to(device)
    try:
        model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
        print(f"[*] Berhasil memuat model dari {MODEL_PATH}")
    except FileNotFoundError:
        print(f"[!] File {MODEL_PATH} tidak ditemukan.")
        return

    # 3. Hitung Prototypes dari Folder Support
    prototypes, class_names = get_prototypes_from_support(model, SUPPORT_DIR, transform, device)

    # 4. Siapkan Data Testing (Query)
    # Kita menggunakan get_split_indices agar tidak menguji gambar yang sudah dipakai training
    full_dataset = get_tempeh_dataset(DATA_DIR)
    _, test_indices = get_split_indices(full_dataset)
    test_dataset = Subset(full_dataset, test_indices)
    
    test_loader = DataLoader(test_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)

    # 5. Proses Evaluasi
    print(f"\n[*] Memulai Evaluasi pada {len(test_dataset)} gambar testing...")
    model.eval()
    
    correct_predictions = 0
    total_samples = 0
    
    # Simpan hasil untuk Confusion Matrix (Opsional, sangat bagus untuk papermu!)
    class_correct = {c: 0 for c in range(3)}
    class_total = {c: 0 for c in range(3)}

    with torch.no_grad():
        for images, labels in test_loader:
            images = images.to(device)
            labels = labels.to(device)
            
            # Ekstrak fitur query
            query_features = model.get_features(images)
            
            # Sesuaikan dimensi untuk menghitung Cosine Similarity
            # query: (Batch, 1, 2048), prototypes: (1, 3, 2048)
            n_query = query_features.size(0)
            query_expanded = query_features.unsqueeze(1).expand(n_query, 3, -1)
            prototypes_expanded = prototypes.unsqueeze(0).expand(n_query, 3, -1)
            
            # Hitung Cosine Similarity dan kalikan dengan Temperature
            cosine_sim = F.cosine_similarity(query_expanded, prototypes_expanded, dim=2)
            logits = cosine_sim * model.temperature
            
            # Ambil prediksi terbaik
            _, predictions = torch.max(logits, 1)
            
            # Hitung Akurasi
            correct_predictions += (predictions == labels).sum().item()
            total_samples += labels.size(0)
            
            # Rincian per kelas
            for i in range(labels.size(0)):
                label = labels[i].item()
                pred = predictions[i].item()
                class_total[label] += 1
                if label == pred:
                    class_correct[label] += 1

    # --- TAMPILKAN HASIL ---
    final_acc = correct_predictions / total_samples
    print("\n" + "="*40)
    print("HASIL EVALUASI FIXED SUPPORT SET")
    print("="*40)
    print(f"Total Gambar Uji : {total_samples}")
    print(f"Akurasi Total    : {final_acc * 100:.2f}%\n")
    
    print("Akurasi Per Fase:")
    for i in range(3):
        if class_total[i] > 0:
            acc = class_correct[i] / class_total[i]
            print(f"- {class_names[i]}: {acc * 100:.2f}% ({class_correct[i]}/{class_total[i]})")
    print("="*40)

if __name__ == "__main__":
    test_with_fixed_support()