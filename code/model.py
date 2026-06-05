import torch
import torch.nn as nn
import torch.nn.functional as F
import torchvision.models as models

class PrototypicalNetwork(nn.Module):
    """
    Arsitektur Prototypical Network dengan ResNet-50 sebagai backbone.
    Menggunakan Cosine Similarity untuk klasifikasi few-shot.
    """
    def __init__(self, backbone_name='resnet50'):
        super(PrototypicalNetwork, self).__init__()
        
        # Inisialisasi ResNet-50 dengan pre-trained weights
        try:
            weights = models.ResNet50_Weights.IMAGENET1K_V1
            resnet = models.resnet50(weights=weights)
            print("[*] Berhasil memuat pre-trained ResNet-50 weights.")
        except Exception as e:
            print(f"[!] Gagal mendownload weights: {e}")
            print("[*] Menggunakan ResNet-50 dengan weights acak.")
            resnet = models.resnet50(weights=None)
        
        # Ambil backbone saja (tanpa layer FC terakhir)
        self.backbone = nn.Sequential(*list(resnet.children())[:-1])
        
        # Learnable temperature parameter untuk penskalaan Cosine Similarity
        self.temperature = nn.Parameter(torch.tensor(10.0))

    def get_features(self, x):
        """Ekstraksi fitur dari gambar input."""
        features = self.backbone(x)
        return features.view(features.size(0), -1)

    def forward(self, support_images, query_images, n_way, k_shot):
        """
        Forward pass untuk menghitung logits berdasarkan jarak ke prototype.
        """
        # Ekstrak fitur untuk support dan query
        support_features = self.get_features(support_images)
        query_features = self.get_features(query_images)
        
        # Hitung Prototype (rata-rata fitur per kelas)
        support_features = support_features.view(n_way, k_shot, -1)
        prototypes = support_features.mean(dim=1) 
        
        n_query = query_features.size(0)
        query_expanded = query_features.unsqueeze(1).expand(n_query, n_way, -1)
        prototypes_expanded = prototypes.unsqueeze(0).expand(n_query, n_way, -1)
        
        # Klasifikasi menggunakan Cosine Similarity
        cosine_sim = F.cosine_similarity(query_expanded, prototypes_expanded, dim=2)
        
        # Skalakan dengan temperature
        logits = cosine_sim * self.temperature
        
        return logits, query_features, prototypes
