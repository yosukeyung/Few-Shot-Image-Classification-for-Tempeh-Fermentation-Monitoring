import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
from torch.utils.data import DataLoader

from data_loader import get_tempeh_dataset
from sampler import EpisodicBatchSampler
from model import PrototypicalNetwork

def train():

    DATA_DIR = "./data"      
    N_WAY = 3                
    K_SHOT = 10            
    Q_QUERY = 10             
    N_EPISODES = 25          
    EPOCHS = 50            
    LEARNING_RATE = 0.0005  

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[*] Menggunakan device: {device}")

    dataset = get_tempeh_dataset(DATA_DIR)
    labels = [label for _, label in dataset.samples]
    
    sampler = EpisodicBatchSampler(labels=labels, n_episodes=N_EPISODES, 
                                   n_way=N_WAY, k_shot=K_SHOT, q_query=Q_QUERY)

    dataloader = DataLoader(dataset, batch_sampler=sampler, num_workers=2, pin_memory=True)

    model = PrototypicalNetwork(backbone_name='resnet50').to(device)
    
    for param in model.backbone.parameters():
        param.requires_grad = True

    criterion_ce = nn.CrossEntropyLoss()
    
    criterion_triplet = nn.TripletMarginWithDistanceLoss(
        distance_function=lambda x, y: 1.0 - F.cosine_similarity(x, y),
        margin=0.2
    )
    
    TRIPLET_WEIGHT = 0.5

    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=15, gamma=0.5)

    scaler = torch.cuda.amp.GradScaler()

    print("\n[*] Memulai Proses Training (ResNet-50 + Cosine + Triplet)...")
    best_acc = 0.0 
    
    for epoch in range(EPOCHS):
        model.train()
        total_loss = 0.0
        total_acc = 0.0
        
        for episode, (images, _) in enumerate(dataloader):
            images = images.to(device)
            C, H, W = images.shape[1:]
            images = images.view(N_WAY, K_SHOT + Q_QUERY, C, H, W)
            
            support_images = images[:, :K_SHOT, :, :, :].reshape(-1, C, H, W)
            query_images = images[:, K_SHOT:, :, :, :].reshape(-1, C, H, W)
            
            optimizer.zero_grad()
            
            # --- BUNGKUS DENGAN AUTOCAST (Mempercepat Forward Pass) ---
            with torch.cuda.amp.autocast():
                logits, query_features, prototypes = model(support_images, query_images, N_WAY, K_SHOT)
                target_labels = torch.arange(N_WAY).repeat_interleave(Q_QUERY).to(device)
                
                # Combined Loss: CE + Triplet
                loss_ce = criterion_ce(logits, target_labels)
                
                 # Hard Negative Mining untuk Triplet Loss
                positive_prototypes = prototypes[target_labels]
                mask = F.one_hot(target_labels, num_classes=N_WAY).bool()
                logits_negative = logits.clone()
                logits_negative[mask] = -float('inf') 
                hard_negative_indices = logits_negative.argmax(dim=1) 
                negative_prototypes = prototypes[hard_negative_indices]
                
                loss_triplet = criterion_triplet(query_features, positive_prototypes, negative_prototypes)
                loss = loss_ce + (TRIPLET_WEIGHT * loss_triplet)
            
            # --- GUNAKAN SCALER UNTUK BACKWARD PASS ---
            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()
            # ------------------------------------------
            
            _, predictions = torch.max(logits, 1)
            accuracy = (predictions == target_labels).float().mean().item()
            
            total_loss += loss.item()
            total_acc += accuracy
            
        avg_loss = total_loss / N_EPISODES
        avg_acc = total_acc / N_EPISODES
        print(f"Epoch [{epoch+1}/{EPOCHS}] | Total Loss: {avg_loss:.4f} | Accuracy: {avg_acc*100:.2f}%")
        
        if avg_acc > best_acc:
            best_acc = avg_acc
            torch.save(model.state_dict(), "tempeh_resnet50_best.pth")
            print(f"    -> [!] Model tersimpan! (Rekor baru: {best_acc*100:.2f}%)")
            
        scheduler.step()

    print("\n[*] Training Selesai!")
    print(f"[*] Akurasi Tertinggi: {best_acc*100:.2f}%")

if __name__ == "__main__":
    train()