from fastapi import FastAPI, File, UploadFile, Response
from fastapi.responses import FileResponse
import os
import torch
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
    """Función temporal - devuelve valores falsos mientras se solucionan dependencias"""
    return {
        "is_gore": False, 
        "gore_confidence": 0.0,
        "is_porn": False,
        "porn_confidence": 0.0,
        "dressed_confidence": 0.0,
        "artwork_confidence": 0.0,
        "is_artwork": False,
        "is_false_positive": False
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
            temperature=1.0,
            top_k=50, 
            top_p=0.9,
            repetition_penalty=1.1
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
    """Endpoint temporal - devuelve valores falsos mientras se solucionan dependencias"""
    return {"nsfw": []}

@app.post("/detect/gore")
async def detect_gore_endpoint(file: UploadFile = File(...)):
    """Endpoint temporal - devuelve valores falsos mientras se solucionan dependencias"""
    return {
        "is_gore": False,
        "confidence": 0.0,
        "is_porn_clip": False,
        "porn_confidence": 0.0
    }

@app.post("/detect/clip")
async def detect_clip_endpoint(file: UploadFile = File(...)):
    """Endpoint temporal - devuelve valores falsos mientras se solucionan dependencias"""
    return {"tags": []}

@app.post("/detect")
async def detect_image(file: UploadFile = File(...)):
    """Endpoint temporal - devuelve valores falsos mientras se solucionan dependencias"""
    return {
        "nsfw": [],
        "gore": {
            "is_gore": False,
            "confidence": 0.0
        },
        "porn_clip": {
            "is_porn": False,
            "confidence": 0.0
        }
    }
