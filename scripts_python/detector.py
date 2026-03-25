from fastapi import FastAPI, UploadFile, File, HTTPException
import uvicorn
import clip
import torch
import json
import os
from PIL import Image
from nudenet import NudeDetector
import io

app = FastAPI()

# Configurar dispositivo a CPU
device = "cpu"

print("Cargando modelos en memoria...")
# Cargar NudeNet (Detector de objetos)
detector = NudeDetector()

# Cargar CLIP oficial de OpenAI
model, preprocess = clip.load("ViT-B/32", device=device)
print("Modelos cargados correctamente.")

@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    try:
        # 1. Leer contenido
        contents = await file.read()
        
        # 2. VALIDACIÓN CRÍTICA: Si el bot mandó 0 bytes, frenar aquí
        if len(contents) == 0:
            print("❌ Error: Recibí un archivo vacío del bot.")
            raise HTTPException(status_code=400, detail="Buffer vacío")

        try:
            # 3. Probar si Pillow puede abrirlo antes de pasarlo a NudeNet
            image = Image.open(io.BytesIO(contents)).convert("RGB")
            # verify() no funciona después de convert() o transformaciones, 
            # pero el hecho de abrirlo y convertirlo ya es una validación.
        except Exception as e:
            print(f"❌ Error de imagen corrupta: {e}")
            raise HTTPException(status_code=400, detail="Imagen corrupta o formato no soportado")
        
        # 1. NudeNet (NSFW)
        # NudeNet 3.x requiere un path de archivo para .detect()
        # Para evitar problemas de concurrencia y lentitud, guardamos un temporal muy breve
        temp_path = f"temp_{os.getpid()}_{torch.randint(0, 1000000, (1,)).item()}.jpg"
        image.save(temp_path)
        
        nude_results = detector.detect(temp_path)
        os.remove(temp_path)
        
        is_nsfw_score = 1.0 if len(nude_results) > 0 else 0.0

        # 2. CLIP (Gore, Anime, Porn, Hentai, Sexting)
        image_input = preprocess(image).unsqueeze(0).to(device)
        labels = [
            "a photo of gore and blood", 
            "an anime illustration", 
            "a normal photo",
            "pornography and sexual acts",
            "hentai anime illustration",
            "suggestive sexting photo"
        ]
        text = clip.tokenize(labels).to(device)
        
        with torch.no_grad():
            logits_per_image, _ = model(image_input, text)
            probs = logits_per_image.softmax(dim=-1).cpu().numpy()[0]

        return {
            "nsfw": is_nsfw_score,
            "gore": float(probs[0]),
            "is_anime": float(probs[1]) > 0.5,
            "porn": float(probs[3]),
            "hentai": float(probs[4]),
            "sexting": float(probs[5])
        }

    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
