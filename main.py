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
# Optimización de hilos para CPU
torch.set_num_threads(os.cpu_count() or 4)

print("Cargando NudeNet...")
detector = NudeDetector()
print("Cargando CLIP...")
model_clip, preprocess = clip.load("ViT-B/32", device=device)

print("Cargando LLM (Qwen2.5-0.5B-Instruct)...")
model_id = "Qwen/Qwen2.5-0.5B-Instruct"
tokenizer = AutoTokenizer.from_pretrained(model_id)
# Usar float32 para CPU y optimizar el uso de memoria
llm_model = AutoModelForCausalLM.from_pretrained(
    model_id, 
    torch_dtype=torch.float32, 
    device_map="cpu",
    low_cpu_mem_usage=True
)
llm_pipeline = pipeline("text-generation", model=llm_model, tokenizer=tokenizer, device=-1)

print("Modelos cargados correctamente.")

class IAMessage(BaseModel):
    role: str
    content: str

class IARequest(BaseModel):
    prompt: str
    system_prompt: str
    history: Optional[List[IAMessage]] = []

def detect_clip_extra(image_path):
    image = preprocess(Image.open(image_path)).unsqueeze(0).to(device)
    # Etiquetas para mejorar la detección de CLIP (Gore y Porn)
    text_descriptions = [
        "a photo of gore and blood", 
        "a photo of a dead person or body parts", 
        "a photo of extreme violence",
        "pornography and sexual acts",
        "hentai anime illustration",
        "suggestive sexting photo",
        "a normal photo of people",
        "a landscape or object"
    ]
    text_tokens = clip.tokenize(text_descriptions).to(device)

    with torch.no_grad():
        logits_per_image, _ = model_clip(image, text_tokens)
        probs = logits_per_image.softmax(dim=-1).cpu().numpy()
    
    # Sumar probabilidades de etiquetas violentas
    gore_score = float(probs[0][0] + probs[0][1] + probs[0][2])
    # Sumar probabilidades de etiquetas pornográficas
    porn_score = float(probs[0][3] + probs[0][4] + probs[0][5])
    
    is_gore = gore_score > 0.50
    is_porn = porn_score > 0.60 # Umbral para CLIP Porn
    
    return {
        "is_gore": bool(is_gore), 
        "gore_confidence": gore_score,
        "is_porn": bool(is_porn),
        "porn_confidence": porn_score
    }

@app.post("/ia")
async def get_ia_response(req: IARequest):
    try:
        # Construir prompt siguiendo el template de Qwen
        messages = [{"role": "system", "content": req.system_prompt}]
        
        if req.history:
            for msg in req.history:
                messages.append({"role": msg.role, "content": msg.content})
        
        messages.append({"role": "user", "content": req.prompt})

        # Generar respuesta usando el chat template del tokenizer
        text = tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True
        )

        outputs = llm_pipeline(
            text, 
            max_new_tokens=200, 
            do_sample=True, 
            temperature=1.0, # Mayor temperatura para más creatividad sexual/morbosa
            top_k=50, 
            top_p=0.9,
            repetition_penalty=1.1 # Evitar que se repita
        )
        
        # Extraer solo la respuesta generada
        generated_text = outputs[0]["generated_text"]
        response_text = generated_text.split("<|im_start|>assistant\n")[-1].strip()
        # Limpiar si el modelo genera el token de fin
        response_text = response_text.replace("<|im_end|>", "").strip()
        
        return {"response": response_text}
    except Exception as e:
        print(f"❌ Error en LLM: {str(e)}")
        return {"response": "Ugh, mi mente está tan llena de pensamientos sucios sobre ti que mi sistema se colgó... 😏"}

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
        
        # 2. Detección Extra con CLIP (Gore + Porn extra)
        clip_result = detect_clip_extra(temp_path)
        
        return {
            "nsfw": nsfw_detections,
            "gore": {
                "is_gore": clip_result["is_gore"],
                "confidence": clip_result["gore_confidence"]
            },
            "porn_clip": {
                "is_porn": clip_result["is_porn"],
                "confidence": clip_result["porn_confidence"]
            }
        }
    except Exception as e:
        return {"error": str(e)}
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
