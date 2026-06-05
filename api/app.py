import os
import time
import torch
import torch.nn.functional as F
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io
import torchvision.transforms as transforms
from model import PrototypicalNetwork

app = FastAPI(title="TempeClassify API", description="Prototypical Network (ResNet-50 + Cosine) for Tempe Fermentation Stage Classification")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
MODEL_PATH = "tempeh_resnet50_best.pth"
SUPPORT_DIR = "support"
CLASSES = ["Day-0", "Day-1", "Day-2"]
CLASS_MAPPING = {
    "Day-0": "day_0",
    "Day-1": "day_1",
    "Day-2": "day_2"
}
K_SHOT = 10  # 10-shot per class

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Image transforms for inference (no augmentation)
inference_transforms = transforms.Compose([
    transforms.Resize((320, 320)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# Global variables for model and pre-computed prototypes
model = None
prototypes = None

def load_and_preprocess_image(image_bytes):
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        return inference_transforms(image).unsqueeze(0).to(device)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image format: {str(e)}")

@app.on_event("startup")
def startup_event():
    global model, prototypes
    print("[*] Starting up TempeClassify Inference Server (ResNet-50 + Cosine Similarity)...")
    
    # 1. Load model architecture & weights
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model weights file not found at: {MODEL_PATH}")
        
    model = PrototypicalNetwork(backbone_name='resnet50').to(device)
    model.load_state_dict(torch.load(MODEL_PATH, map_location=device, weights_only=False))
    model.eval()
    print(f"[*] ResNet-50 model loaded. Learned temperature: {model.temperature.item():.4f}")
    
    # 2. Compute Prototypes (Centroids) from 10-shot support set
    prototype_list = []
    
    for cls in CLASSES:
        cls_dir = os.path.join(SUPPORT_DIR, cls)
        if not os.path.exists(cls_dir):
            raise FileNotFoundError(f"Support set directory for class {cls} not found at: {cls_dir}")
            
        cls_features = []
        files = [f for f in os.listdir(cls_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
        
        if len(files) == 0:
            raise ValueError(f"No support images found in {cls_dir}")
            
        print(f"[*] Processing {len(files)} support images for class '{cls}'...")
        
        for file in files:
            file_path = os.path.join(cls_dir, file)
            with open(file_path, "rb") as f:
                img_bytes = f.read()
            img_tensor = load_and_preprocess_image(img_bytes)
            
            with torch.no_grad():
                features = model.get_features(img_tensor)  # Shape: (1, 2048)
                cls_features.append(features)
                
        # Stack and average to find centroid
        cls_features_tensor = torch.cat(cls_features, dim=0)  # Shape: (K_SHOT, 2048)
        cls_centroid = cls_features_tensor.mean(dim=0, keepdim=True)  # Shape: (1, 2048)
        prototype_list.append(cls_centroid)
        
    # Stack prototypes: Shape (3, 2048)
    prototypes = torch.cat(prototype_list, dim=0)
    print(f"[*] Prototypes calculated successfully. Shape: {prototypes.shape}")

@app.get("/health")
def health():
    return {
        "status": "online",
        "model": "PrototypicalNetwork_ResNet50_Cosine",
        "device": str(device),
        "classes": [CLASS_MAPPING[c] for c in CLASSES],
        "k_shot": K_SHOT,
        "version": "3.0"
    }

@app.post("/classify")
async def classify(file: UploadFile = File(...)):
    start_time = time.time()
    
    # Read file
    img_bytes = await file.read()
    query_tensor = load_and_preprocess_image(img_bytes)
    
    with torch.no_grad():
        # Get query features
        query_features = model.get_features(query_tensor)  # Shape: (1, 2048)
        
        # Calculate Cosine Similarity to prototypes
        # query_features: (1, 2048) -> (1, 1, 2048) -> (1, 3, 2048)
        # prototypes: (3, 2048) -> (1, 3, 2048)
        query_expanded = query_features.unsqueeze(1).expand(1, len(CLASSES), -1)
        prototypes_expanded = prototypes.unsqueeze(0).expand(1, len(CLASSES), -1)
        
        cosine_sim = F.cosine_similarity(query_expanded, prototypes_expanded, dim=2)  # Shape: (1, 3)
        logits = cosine_sim * model.temperature  # Scale by learned temperature
        
        # Calculate probabilities using Softmax
        probabilities = torch.softmax(logits, dim=1).squeeze(0)  # Shape: (3,)
        
        # Find prediction
        pred_idx = torch.argmax(probabilities).item()
        predicted_class = CLASS_MAPPING[CLASSES[pred_idx]]
        confidence = probabilities[pred_idx].item()
        
        # Prepare individual class confidence percentages
        confidences = {
            CLASS_MAPPING[CLASSES[i]]: float(probabilities[i].item()) for i in range(len(CLASSES))
        }
        
    processing_time = time.time() - start_time
    
    # Generate specimen ID (TC-[timestamp]-[random_hex])
    specimen_id = f"TC-{int(time.time() * 10) % 10000:04d}-{os.urandom(1).hex().upper()}"
    
    return {
        "specimen_id": specimen_id,
        "prediction": predicted_class,
        "confidence": confidence,
        "confidences": confidences,
        "processing_time": round(processing_time, 3)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
