from fastapi import FastAPI, File, UploadFile, Response
from fastapi.responses import FileResponse
from nudenet import NudeDetector
import os
import torch
import clip
from PIL import Image, ImageEnhance
import time
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI()

# Configuración de Hugging Face
hf_token = os.getenv("HF_TOKEN")

@app.get("/")
async def read_root():
    """Interfaz dinámica para HF Spaces: QR, Pairing o Estado"""
    # 1. Si hay un QR activo, mostrarlo
    if os.path.exists("qr.png"):
        return Response(content="""
        <html>
            <head>
                <title>Beyonder v4 - QR Setup</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body { text-align: center; font-family: 'Segoe UI', sans-serif; background: #0a0a0a; color: #e0e0e0; padding-top: 50px; }
                    .card { background: #111; border: 1px solid #333; padding: 30px; border-radius: 20px; display: inline-block; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
                    h1 { color: #00ff88; margin-bottom: 10px; }
                    img { border: 10px solid white; border-radius: 15px; background: white; margin: 20px 0; max-width: 90%; }
                    .footer { margin-top: 30px; color: #666; font-size: 0.9em; }
                    .status-dot { height: 10px; width: 10px; background-color: #00ff88; border-radius: 50%; display: inline-block; margin-right: 5px; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h1>📱 Beyonder v4</h1>
                    <p><span class="status-dot"></span> Esperando vinculación...</p>
                    <p>Escanea este código con tu WhatsApp para iniciar sesión.</p>
                    <img src="/qr" />
                    <p style="color: #aaa;">Asegúrate de tener la base de datos conectada.</p>
                </div>
                <div class="footer">
                    <p>Beyonder Engine v4.0 | HF Spaces Optimized</p>
                </div>
                <script>setInterval(() => location.reload(), 10000);</script>
            </body>
        </html>
        """, media_type="text/html")
    
    # 2. Si hay un código de vinculación activo
    if os.path.exists("pairing.txt"):
        try:
            with open("pairing.txt", "r") as f:
                code = f.read().strip()
            return Response(content=f"""
            <html>
                <head>
                    <title>Beyonder v4 - Pairing Code</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <style>
                        body {{ text-align: center; font-family: 'Segoe UI', sans-serif; background: #0a0a0a; color: #e0e0e0; padding-top: 50px; }}
                        .card {{ background: #111; border: 1px solid #333; padding: 30px; border-radius: 20px; display: inline-block; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }}
                        h1 {{ color: #0088ff; margin-bottom: 10px; }}
                        .code {{ font-size: 3.5em; font-weight: bold; color: #00ff88; letter-spacing: 8px; margin: 30px 0; border: 2px dashed #00ff88; padding: 25px; border-radius: 10px; background: rgba(0,255,136,0.05); }}
                        .footer {{ margin-top: 30px; color: #666; font-size: 0.9em; }}
                    </style>
                </head>
                <body>
                    <div class="card">
                        <h1>🔗 Beyonder v4</h1>
                        <p>Usa este código en tu WhatsApp:</p>
                        <p style="font-size: 0.9em; color: #aaa;">(Dispositivos vinculados > Vincular con número de teléfono)</p>
                        <div class="code">{code}</div>
                        <p style="color: #ffaa00;">⚠️ El código expira pronto.</p>
                    </div>
                    <div class="footer">
                        <p>Beyonder Engine v4.0 | Pairing Mode Active</p>
                    </div>
                    <script>setInterval(() => location.reload(), 15000);</script>
                </body>
            </html>
            """, media_type="text/html")
        except:
            pass
    
    # 3. Estado normal (Bot conectado)
    return Response(content="""
    <html>
        <head>
            <title>Beyonder v4 - Online</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body { text-align: center; font-family: 'Segoe UI', sans-serif; background: #0a0a0a; color: #e0e0e0; padding-top: 50px; }
                .card { background: #111; border: 1px solid #333; padding: 30px; border-radius: 20px; display: inline-block; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
                h1 { color: #00ff88; margin-bottom: 10px; }
                .status-badge { background: rgba(0,255,136,0.1); color: #00ff88; padding: 5px 15px; border-radius: 20px; font-weight: bold; font-size: 0.9em; border: 1px solid #00ff88; }
                .features { text-align: left; margin-top: 20px; font-size: 0.9em; color: #aaa; }
                .features li { margin-bottom: 5px; }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>🚀 Beyonder v4</h1>
                <div style="margin-bottom: 20px;"><span class="status-badge">● ONLINE</span></div>
                <p>Bot iniciado correctamente y conectado.</p>
                <div class="features">
                    <p>Sistemas activos:</p>
                    <ul>
                        <li>✅ IA Neural (Qwen 2.5)</li>
                        <li>✅ Visión Artificial (CLIP + NudeNet)</li>
                        <li>✅ Detección de Gore & NSFW</li>
                        <li>✅ EventBus Engine v4</li>
                    </ul>
                </div>
            </div>
            <script>setInterval(() => location.reload(), 30000);</script>
        </body>
    </html>
    """, media_type="text/html")

@app.get("/qr")
async def get_qr():
    """Sirve el archivo qr.png generado por el bot"""
    if os.path.exists("qr.png"):
        return FileResponse("qr.png")
    return {"status": "no_qr"}

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

# Cargar con reintentos para evitar Rate Limit
def load_with_retry(load_func, *args, **kwargs):
    for i in range(3):
        try:
            return load_func(*args, **kwargs)
        except Exception as e:
            if "429" in str(e) and i < 2:
                print(f"⚠️ Rate limit (429) detectado. Reintentando en 60s... (Intento {i+1}/3)")
                time.sleep(60)
            else:
                raise e

tokenizer = load_with_retry(AutoTokenizer.from_pretrained, model_id, token=hf_token)
# Usar float32 para CPU y optimizar el uso de memoria
llm_model = load_with_retry(
    AutoModelForCausalLM.from_pretrained,
    model_id, 
    torch_dtype=torch.float32, 
    device_map="cpu",
    low_cpu_mem_usage=True,
    token=hf_token
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
    # Cargar imagen y normalizar
    with Image.open(image_path) as img:
        img = img.convert("RGB")
        # 1. Reducir saturación un 10% para evitar sesgo de tonos cálidos
        converter = ImageEnhance.Color(img)
        img = converter.enhance(0.9)
        # 2. Ajustar contraste
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(1.2)
        image_input = preprocess(img).unsqueeze(0).to(device)

    # Etiquetas para validación semántica cruzada
    text_descriptions = [
        "explicit sexual content",      # 0
        "pornography and sexual acts",   # 1
        "a person wearing a swimsuit",   # 2
        "a person showing skin but dressed", # 3
        "an anime character with tan skin",  # 4
        "a photo of gore and blood",     # 5
        "artwork or digital drawing",    # 6
        "a normal photo of people",      # 7
        "a landscape or object"          # 8
    ]
    text_tokens = clip.tokenize(text_descriptions).to(device)

    with torch.no_grad():
        logits_per_image, _ = model_clip(image_input, text_tokens)
        probs = logits_per_image.softmax(dim=-1).cpu().numpy()[0]
    
    # Lógica de Validación Semántica:
    score_porn = float(probs[0] + probs[1])
    score_dressed = float(probs[2] + probs[3] + probs[4])
    score_gore = float(probs[5])
    score_artwork = float(probs[6])
    
    is_porn = score_porn > 0.65 and score_porn > score_dressed
    is_gore = score_gore > 0.55
    
    return {
        "is_gore": bool(is_gore), 
        "gore_confidence": score_gore,
        "is_porn": bool(is_porn),
        "porn_confidence": score_porn,
        "dressed_confidence": score_dressed,
        "artwork_confidence": score_artwork,
        "is_artwork": score_artwork > 0.50,
        "is_false_positive": score_dressed > score_porn
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

@app.post("/detect/nsfw")
async def detect_nsfw_endpoint(file: UploadFile = File(...)):
    temp_path = f"temp_nsfw_{os.getpid()}.jpg"
    try:
        contents = await file.read()
        if not contents:
            return {"error": "Buffer vacío"}
            
        with open(temp_path, "wb") as f:
            f.write(contents)
        
        # Detección NSFW con NudeNet
        nsfw_detections = detector.detect(temp_path)
        
        return {"nsfw": nsfw_detections}
    except Exception as e:
        return {"error": str(e)}
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.post("/detect/gore")
async def detect_gore_endpoint(file: UploadFile = File(...)):
    temp_path = f"temp_gore_{os.getpid()}.jpg"
    try:
        contents = await file.read()
        if not contents:
            return {"error": "Buffer vacío"}
            
        with open(temp_path, "wb") as f:
            f.write(contents)
        
        # Detección Gore con CLIP
        clip_result = detect_clip_extra(temp_path)
        
        return {
            "is_gore": clip_result["is_gore"],
            "confidence": clip_result["gore_confidence"],
            "is_porn_clip": clip_result["is_porn"], # Backup por si NudeNet falla
            "porn_confidence": clip_result["porn_confidence"]
        }
    except Exception as e:
        return {"error": str(e)}
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.post("/detect/clip")
async def detect_clip_endpoint(file: UploadFile = File(...)):
    temp_path = f"temp_clip_{os.getpid()}.jpg"
    try:
        contents = await file.read()
        if not contents:
            return {"error": "Buffer vacío"}
            
        with open(temp_path, "wb") as f:
            f.write(contents)
        
        # 1. Cargar imagen y normalizar
        with Image.open(temp_path) as img:
            img = img.convert("RGB")
            image_input = preprocess(img).unsqueeze(0).to(device)

        # 2. Etiquetas para clasificación semántica (Picardía + Contexto)
        text_descriptions = [
            "a photo of a dog", "a photo of a cat", "a meme", "an anime drawing",
            "provocativo", "sugerente", "doble sentido", "pose sexual", "sexy", "hot", "ropa interior",
            "a person smiling", "a landscape", "text only", "a sticker"
        ]
        text_tokens = clip.tokenize(text_descriptions).to(device)

        with torch.no_grad():
            logits_per_image, _ = model_clip(image_input, text_tokens)
            probs = logits_per_image.softmax(dim=-1).cpu().numpy()[0]
        
        # Filtrar etiquetas con probabilidad > 15%
        tags = [text_descriptions[i] for i, prob in enumerate(probs) if prob > 0.15]
        
        return {"tags": tags}
    except Exception as e:
        return {"error": str(e)}
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.post("/detect")
async def detect_image(file: UploadFile = File(...)):
    # Mantener compatibilidad por si acaso, pero preferir endpoints específicos
    temp_path = f"temp_all_{os.getpid()}.jpg"
    try:
        contents = await file.read()
        if not contents:
            return {"error": "Buffer vacío"}
            
        with open(temp_path, "wb") as f:
            f.write(contents)
        
        nsfw_detections = detector.detect(temp_path)
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
