import torch
from torch.utils.data import DataLoader
from data_loader import get_tempeh_dataset, get_split_indices
from sampler import EpisodicBatchSampler
from model import PrototypicalNetwork

def test():
    # --- CONFIGURATION ---
    DATA_DIR = "./data"      
    MODEL_PATH = "models/tempeh_resnet50_best.pth"
    N_WAY = 3                
    K_SHOT = 10              
    Q_QUERY = 10             
    N_EPISODES = 50          # Lebih banyak episode untuk evaluasi yang stabil

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[*] Menggunakan device: {device}")

    # 1. Load Dataset and Split
    dataset = get_tempeh_dataset(DATA_DIR)
    _, test_indices = get_split_indices(dataset)
    labels = [label for _, label in dataset.samples]
    
    # 2. Setup Sampler and DataLoader for Testing
    sampler = EpisodicBatchSampler(labels=labels, n_episodes=N_EPISODES, 
                                   n_way=N_WAY, k_shot=K_SHOT, q_query=Q_QUERY,
                                   subset_indices=test_indices)
    dataloader = DataLoader(dataset, batch_sampler=sampler, num_workers=0, pin_memory=True)

    # 3. Load Model
    model = PrototypicalNetwork(backbone_name='resnet50').to(device)
    try:
        model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
        print(f"[*] Berhasil memuat model dari {MODEL_PATH}")
    except FileNotFoundError:
        print(f"[!] File {MODEL_PATH} tidak ditemukan. Silakan run main.py dulu.")
        return

    model.eval()
    total_acc = 0.0

    print(f"\n[*] Memulai Evaluasi ({N_EPISODES} episode)...")
    
    with torch.no_grad():
        for episode, (images, _) in enumerate(dataloader):
            images = images.to(device)
            C, H, W = images.shape[1:]
            
            # Reshape ke (N_WAY, K_SHOT + Q_QUERY, C, H, W)
            images = images.view(N_WAY, K_SHOT + Q_QUERY, C, H, W)
            
            support_images = images[:, :K_SHOT, :, :, :].reshape(-1, C, H, W)
            query_images = images[:, K_SHOT:, :, :, :].reshape(-1, C, H, W)
            
            # Forward pass
            logits, _, _ = model(support_images, query_images, N_WAY, K_SHOT)
            
            # Labels target
            target_labels = torch.arange(N_WAY).repeat_interleave(Q_QUERY).to(device)
            
            # Hitung Akurasi
            _, predictions = torch.max(logits, 1)
            accuracy = (predictions == target_labels).float().mean().item()
            total_acc += accuracy
            
            if (episode + 1) % 10 == 0:
                print(f"Episode [{episode+1}/{N_EPISODES}] | Current Avg Acc: {(total_acc/(episode+1))*100:.2f}%")

    avg_acc = total_acc / N_EPISODES
    print(f"\n[FINISH] Hasil Evaluasi:")
    print(f"[*] Rata-rata Akurasi: {avg_acc*100:.2f}%")

if __name__ == "__main__":
    test()
