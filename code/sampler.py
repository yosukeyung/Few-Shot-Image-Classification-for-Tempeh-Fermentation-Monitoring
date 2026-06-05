import numpy as np
import torch
from torch.utils.data import Sampler

class EpisodicBatchSampler(Sampler):
    """
    Sampler untuk Few-Shot Learning yang menghasilkan batch dalam bentuk episode.
    Setiap episode berisi N-Way kelas dengan K-Shot support dan Q-Query query images.
    """
    def __init__(self, labels, n_episodes, n_way, k_shot, q_query, subset_indices=None):
        self.n_episodes = n_episodes
        self.n_way = n_way
        self.k_shot = k_shot
        self.q_query = q_query
        
        labels = np.array(labels)
        self.indices_per_class = []
        
        # Kelompokkan indeks berdasarkan kelas
        for i in range(n_way):
            class_indices = np.where(labels == i)[0]
            
            # Filter jika menggunakan subset (train/test split)
            if subset_indices is not None:
                subset_set = set(subset_indices)
                class_indices = np.array([idx for idx in class_indices if idx in subset_set])
            
            self.indices_per_class.append(class_indices)

    def __len__(self):
        return self.n_episodes

    def __iter__(self):
        for _ in range(self.n_episodes):
            batch_indices = []
            
            # Untuk setiap kelas dalam N-Way
            for class_idx in range(self.n_way):
                class_indices = self.indices_per_class[class_idx]
                
                # Ambil sampel secara acak tanpa pengembalian (shuffle)
                # Pastikan jumlah sampel cukup (K+Q)
                selected_indices = np.random.choice(
                    class_indices, 
                    size=self.k_shot + self.q_query, 
                    replace=len(class_indices) < (self.k_shot + self.q_query)
                )
                
                batch_indices.extend(selected_indices)
            
            yield batch_indices
