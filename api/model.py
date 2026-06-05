import torch
import torch.nn as nn
import torch.nn.functional as F
import torchvision.models as models

class PrototypicalNetwork(nn.Module):
    def __init__(self, backbone_name='resnet50'):
        super(PrototypicalNetwork, self).__init__()
        
        # 1. Upgrade ke ResNet-50 (Lebih dalam, ekstraksi fitur lebih kaya)
        resnet = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V1)
        self.backbone = nn.Sequential(*list(resnet.children())[:-1])
        
        # 2. Learned Temperature parameter untuk scaling Cosine Similarity
        self.temperature = nn.Parameter(torch.tensor(10.0))

    def get_features(self, x):
        features = self.backbone(x)
        return features.view(features.size(0), -1)  # Output: (Batch, 2048)

    def forward(self, support_images, query_images, n_way, k_shot):
        support_features = self.get_features(support_images)
        query_features = self.get_features(query_images)
        
        support_features = support_features.view(n_way, k_shot, -1)
        prototypes = support_features.mean(dim=1)
        
        n_query = query_features.size(0)
        query_expanded = query_features.unsqueeze(1).expand(n_query, n_way, -1)
        prototypes_expanded = prototypes.unsqueeze(0).expand(n_query, n_way, -1)
        
        # Cosine Similarity (menggantikan Euclidean Distance)
        cosine_sim = F.cosine_similarity(query_expanded, prototypes_expanded, dim=2)
        
        # Logits dikalikan dengan temperature agar probabilitas lebih tegas
        logits = cosine_sim * self.temperature
        
        return logits, query_features, prototypes