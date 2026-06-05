import torch
import numpy as np
from torch.utils.data import DataLoader
from data_loader import get_tempeh_dataset, get_split_indices
from sampler import EpisodicBatchSampler
from model import PrototypicalNetwork
from sklearn.metrics import confusion_matrix, classification_report

def test_binary():
    # --- CONFIGURATION ---
    DATA_DIR = "./data"      
    MODEL_PATH = "models/tempeh_resnet50_best.pth"
    
    # Kita fokus ke Day-1 dan Day-2 saja
    # Di ImageFolder, biasanya Day-0=0, Day-1=1, Day-2=2
    TARGET_CLASSES = [1, 2] 
    CLASS_NAMES = ["Day-1", "Day-2"]
    
    N_WAY = 2                # Binary classification
    K_SHOT = 10              
    Q_QUERY = 10             
    N_EPISODES = 50          

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[*] Menggunakan device: {device}")

    # 1. Load Dataset and Split
    dataset = get_tempeh_dataset(DATA_DIR)
    _, test_indices = get_split_indices(dataset)
    labels = np.array([label for _, label in dataset.samples])
    
    # Filter labels dan indices agar hanya berisi Day-1 (1) dan Day-2 (2)
    binary_test_indices = [idx for idx in test_indices if labels[idx] in TARGET_CLASSES]
    
    # Mapping label agar sampler tidak error (Sampler butuh index 0...N-1)
    # Kita buat mapping: 1 -> 0 (Day-1), 2 -> 1 (Day-2)
    binary_labels = np.copy(labels)
    binary_labels[labels == 1] = 0
    binary_labels[labels == 2] = 1
    
    # 2. Setup Sampler and DataLoader
    sampler = EpisodicBatchSampler(labels=binary_labels, n_episodes=N_EPISODES, 
                                   n_way=N_WAY, k_shot=K_SHOT, q_query=Q_QUERY,
                                   subset_indices=binary_test_indices)
    dataloader = DataLoader(dataset, batch_sampler=sampler, num_workers=0, pin_memory=True)

    # 3. Load Model
    model = PrototypicalNetwork(backbone_name='resnet50').to(device)
    try:
        model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
        print(f"[*] Berhasil memuat model dari {MODEL_PATH}")
    except FileNotFoundError:
        print(f"[!] File {MODEL_PATH} tidak ditemukan.")
        return

    model.eval()
    
    all_preds = []
    all_targets = []

    print(f"\n[*] Memulai Evaluasi Khusus Day-1 vs Day-2 ({N_EPISODES} episode)...")
    
    with torch.no_grad():
        for episode, (images, _) in enumerate(dataloader):
            images = images.to(device)
            C, H, W = images.shape[1:]
            
            images = images.view(N_WAY, K_SHOT + Q_QUERY, C, H, W)
            
            support_images = images[:, :K_SHOT, :, :, :].reshape(-1, C, H, W)
            query_images = images[:, K_SHOT:, :, :, :].reshape(-1, C, H, W)
            
            # Forward pass
            logits, _, _ = model(support_images, query_images, N_WAY, K_SHOT)
            
            # Labels target (0 for Day-1, 1 for Day-2)
            target_labels = torch.arange(N_WAY).repeat_interleave(Q_QUERY).to(device)
            
            _, predictions = torch.max(logits, 1)
            
            all_preds.extend(predictions.cpu().numpy())
            all_targets.extend(target_labels.cpu().numpy())

    # 4. Analisis Hasil
    print(f"\n[ANALYSIS] Day-1 vs Day-2 Results:")
    
    # Classification Report
    print("\nClassification Report:")
    print(classification_report(all_targets, all_preds, target_names=CLASS_NAMES))
    
    # Confusion Matrix
    cm = confusion_matrix(all_targets, all_preds)
    print("Confusion Matrix:")
    print(f"               Predicted Day-1 | Predicted Day-2")
    print(f"Actual Day-1 |      {cm[0][0]:<10} |      {cm[0][1]:<10}")
    print(f"Actual Day-2 |      {cm[1][0]:<10} |      {cm[1][1]:<10}")

    acc = np.mean(np.array(all_preds) == np.array(all_targets))
    print(f"\n[*] Binary Accuracy (Day-1 vs Day-2): {acc*100:.2f}%")

if __name__ == "__main__":
    test_binary()
