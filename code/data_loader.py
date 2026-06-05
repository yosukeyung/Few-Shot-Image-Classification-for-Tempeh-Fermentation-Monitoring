import os
import torch
import numpy as np
from torchvision import datasets, transforms
from collections import Counter

# Mencegah error library pada beberapa lingkungan Windows
os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'

def get_tempeh_dataset(data_dir):
    """
    Memuat dataset gambar tempe dan menerapkan augmentasi data.
    """
    data_transforms = transforms.Compose([
        transforms.Resize((320, 320)), # Resolusi optimal untuk detail vs memori
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomVerticalFlip(p=0.5),
        transforms.RandomRotation(degrees=20),
        transforms.RandomGrayscale(p=0.2),
        transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.2),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],  
                             std=[0.229, 0.224, 0.225])
    ])

    dataset = datasets.ImageFolder(root=data_dir, transform=data_transforms)
    return dataset

def get_split_indices(dataset, train_split=0.8, seed=42):
    """
    Membagi dataset menjadi indeks train dan test secara stratified.
    """
    labels = np.array([label for _, label in dataset.samples])
    train_indices = []
    test_indices = []
    
    np.random.seed(seed)
    for class_idx in range(len(dataset.classes)):
        class_indices = np.where(labels == class_idx)[0]
        np.random.shuffle(class_indices)
        
        split = int(len(class_indices) * train_split)
        train_indices.extend(class_indices[:split])
        test_indices.extend(class_indices[split:])
        
    return train_indices, test_indices

if __name__ == "__main__":
    DATA_DIRECTORY = "./data" 
    tempeh_dataset = get_tempeh_dataset(DATA_DIRECTORY)
    
    print(f"[*] Total gambar: {len(tempeh_dataset)}")
    print(f"[*] Daftar Kelas: {tempeh_dataset.classes}")
    
    class_counts = Counter([label for _, label in tempeh_dataset.samples])
    print("\n[Jumlah Gambar Per Kelas]")
    for class_idx, count in class_counts.items():
        print(f"- {tempeh_dataset.classes[class_idx]}: {count}")
