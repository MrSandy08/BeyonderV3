from fastapi import FastAPI, File, UploadFile
from nudenet import NudeDetector
import os
import shutil
import torch
import clip
from PIL import Image
import io

app = FastAPI()

# Carga global de modelos al arrancar el Space (CPU)
device = "cpu"
print("Cargando NudeNet...")
detector = NudeDetector()
print("Cargando CLIP...")
model, preprocess = clip.load("ViT-B/32", device=device)
print("Modelos cargados correctamente.")

def detect_gore(image_path):
    image = preprocess(Image.open(image_path)).unsqueeze(0).to(device)
    # Etiquetas más descriptivas para mejorar la detección de CLIP
    text_descriptions = [
        "a photo of gore and blood", 
        "a photo of a dead person or body parts", 
        "a photo of extreme violence",
        "a normal photo of people",
        "a landscape or object"
    ]
    text_tokens = clip.tokenize(text_descriptions).to(device)

    with torch.no_grad():
        logits_per_image, _ = model(image, text_tokens)
        probs = logits_per_image.softmax(dim=-1).cpu().numpy()
    
    # Sumar probabilidades de etiquetas violentas
    gore_score = float(probs[0][0] + probs[0][1] + probs[0][2])
    is_gore = gore_score > 0.50 # Umbral más sensible
    
    return {"is_gore": bool(is_gore), "confidence": gore_score}

@app.get("/")
def home():
    return {"status": "Beyond Squad Detector Online", "mode": "Hugging Face Space (CLIP + NudeNet)"}

@app.post("/detect")
async def detect_image(file: UploadFile = File(...)):
    temp_path = f"/tmp/temp_{os.getpid()}.jpg"
    try:
        contents = await file.read()
        if not contents:
            return {"error": "Buffer vacío"}
            
        with open(temp_path, "wb") as f:
            f.write(contents)
        
        # 1. Detección NSFW con NudeNet
        nsfw_detections = detector.detect(temp_path)
        
        # 2. Detección Gore con CLIP
        gore_result = detect_gore(temp_path)
        
        return {
            "nsfw": nsfw_detections,
            "gore": gore_result
        }
    except Exception as e:
        return {"error": str(e)}
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
