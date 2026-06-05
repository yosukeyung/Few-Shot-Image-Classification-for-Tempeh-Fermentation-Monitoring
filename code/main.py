import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
from torch.utils.data import DataLoader

from data_loader import get_tempeh_dataset, get_split_indices
from sampler import EpisodicBatchSampler
from model import PrototypicalNetwork

def train():
    """
    Fungsi utama untuk melatih model menggunakan Episodic Training.
    """
    # --- Konfigurasi Hyperparameters ---
    DATA_DIR = "./data"      
    N_WAY = 3                # Day-0, Day-1, Day-2
    K_SHOT = 8               # Support images per class
    Q_QUERY = 8              # Query images per class
    N_EPISODES = 25          # Episode per epoch
    EPOCHS = 50              
    LEARNING_RATE = 0.0005   
    TRIPLET_WEIGHT = 0.5     # Bobot penyeimbang Triplet Loss
    MODEL_SAVE_PATH = "models/tempeh_resnet50_best.pth"

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[*] Menggunakan device: {device}")

    # 1. Persiapan Dataset dan DataLoader
    dataset = get_tempeh_dataset(DATA_DIR)
    train_indices, _ = get_split_indices(dataset)
    labels = [label for _, label in dataset.samples]
    
    sampler = EpisodicBatchSampler(labels=labels, n_episodes=N_EPISODES, 
                                   n_way=N_WAY, k_shot=K_SHOT, q_query=Q_QUERY,
                                   subset_indices=train_indices)
    
    # num_workers=0 untuk kompatibilitas Windows
    dataloader = DataLoader(dataset, batch_sampler=sampler, num_workers=0, pin_memory=True)

    # 2. Inisialisasi Model, Optimizer, dan Loss
    model = PrototypicalNetwork(backbone_name='resnet50').to(device)
    
    criterion_ce = nn.CrossEntropyLoss(label_smoothing=0.1)
    criterion_triplet = nn.TripletMarginWithDistanceLoss(
        distance_function=lambda x, y: 1.0 - F.cosine_similarity(x, y),
        margin=0.3
    )

    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=15, gamma=0.5)
    scaler = torch.cuda.amp.GradScaler()

    # 3. Loop Training
    print("\n[*] Memulai Proses Training (ResNet-50 + Cosine + Triplet)...")
    best_acc = 0.0 
    
    for epoch in range(EPOCHS):
        model.train()
        total_loss, total_acc = 0.0, 0.0
        
        for images, _ in dataloader:
            images = images.to(device)
            C, H, W = images.shape[1:]
            images = images.view(N_WAY, K_SHOT + Q_QUERY, C, H, W)
            
            support_images = images[:, :K_SHOT, :, :, :].reshape(-1, C, H, W)
            query_images = images[:, K_SHOT:, :, :, :].reshape(-1, C, H, W)
            
            optimizer.zero_grad()
            
            with torch.cuda.amp.autocast():
                logits, query_features, prototypes = model(support_images, query_images, N_WAY, K_SHOT)
                target_labels = torch.arange(N_WAY).repeat_interleave(Q_QUERY).to(device)
                
                # Combined Loss: CE + Triplet
                loss_ce = criterion_ce(logits, target_labels)
                
                # Hard Negative Mining untuk Triplet Loss
                positive_prototypes = prototypes[target_labels]
                mask = F.one_hot(target_labels, num_classes=N_WAY).bool()
                logits_neg = logits.clone()
                logits_neg[mask] = -float('inf')
                neg_indices = logits_neg.argmax(dim=1)
                negative_prototypes = prototypes[neg_indices]
                
                loss_triplet = criterion_triplet(query_features, positive_prototypes, negative_prototypes)
                loss = loss_ce + (TRIPLET_WEIGHT * loss_triplet)
            
            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()
            
            accuracy = (logits.argmax(1) == target_labels).float().mean().item()
            total_loss += loss.item()
            total_acc += accuracy
            
        avg_loss = total_loss / N_EPISODES
        avg_acc = total_acc / N_EPISODES
        print(f"Epoch [{epoch+1:02d}/{EPOCHS}] | Loss: {avg_loss:.4f} | Acc: {avg_acc*100:.2f}%")
        
        if avg_acc > best_acc:
            best_acc = avg_acc
            torch.save(model.state_dict(), MODEL_SAVE_PATH)
            print(f"    -> [!] Model Baru Tersimpan: {best_acc*100:.2f}%")
            
        scheduler.step()

    print(f"\n[*] Training Selesai! Akurasi Terbaik: {best_acc*100:.2f}%")

if __name__ == "__main__":
    train()
