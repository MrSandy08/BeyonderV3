from fastapi import FastAPI, File, UploadFile, Body
from nudenet import NudeDetector
import os
import shutil
import torch
import clip
from PIL import Image
import io
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI()

# Carga global de modelos al arrancar el Space (CPU)
device = "cpu"
print("Cargando NudeNet...")
detector = NudeDetector()
print("Cargando CLIP...")
model_clip, preprocess = clip.load("ViT-B/32", device=device)

print("Cargando LLM (TinyLlama)...")
model_id = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
tokenizer = AutoTokenizer.from_pretrained(model_id)
# Usar float32 para CPU
llm_model = AutoModelForCausalLM.from_pretrained(model_id, torch_dtype=torch.float32, device_map="cpu")
llm_pipeline = pipeline("text-generation", model=llm_model, tokenizer=tokenizer, device=-1)

print("Modelos cargados correctamente.")

class IAMessage(BaseModel):
    role: str
    content: str

class IARequest(BaseModel):
    prompt: str
    system_prompt: str
    history: Optional[List[IAMessage]] = []

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
        logits_per_image, _ = model_clip(image, text_tokens)
        probs = logits_per_image.softmax(dim=-1).cpu().numpy()
    
    # Sumar probabilidades de etiquetas violentas
    gore_score = float(probs[0][0] + probs[0][1] + probs[0][2])
    is_gore = gore_score > 0.50 # Umbral más sensible
    
    return {"is_gore": bool(is_gore), "confidence": gore_score}

@app.post("/ia")
async def get_ia_response(req: IARequest):
    try:
        # Construir prompt siguiendo el template de TinyLlama
        full_prompt = f"<|system|>\n{req.system_prompt}</s>\n"
        
        if req.history:
            for msg in req.history:
                role = "user" if msg.role == "user" else "assistant"
                full_prompt += f"<|{role}|>\n{msg.content}</s>\n"
        
        full_prompt += f"<|user|>\n{req.prompt}</s>\n<|assistant|>\n"

        # Generar respuesta
        outputs = llm_pipeline(
            full_prompt, 
            max_new_tokens=250, 
            do_sample=True, 
            temperature=0.8, 
            top_k=50, 
            top_p=0.95
        )
        
        # Extraer solo la parte generada después del prompt
        generated_text = outputs[0]["generated_text"]
        response_text = generated_text.split("<|assistant|>\n")[-1].strip()
        
        return {"response": response_text}
    except Exception as e:
        print(f"❌ Error en LLM: {str(e)}")
        return {"response": "Oh, parece que me distraje pensando en cosas... traviesas. 😏"}

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
