from fastapi import FastAPI, File, UploadFile
from nudenet import NudeDetector
import os
import shutil

app = FastAPI()

# Carga global del detector al arrancar el Space
# Nota: La primera vez descargará los modelos en el servidor de HF
detector = NudeDetector()

@app.get("/")
def home():
    return {"status": "Beyond Squad Detector Online", "mode": "Hugging Face Space"}

@app.post("/detect")
async def detect_image(file: UploadFile = File(...)):
    temp_path = f"/tmp/temp_{os.getpid()}.jpg"
    try:
        contents = await file.read()
        if not contents:
            return {"error": "Buffer vacío"}
            
        with open(temp_path, "wb") as f:
            f.write(contents)
        
        detections = detector.detect(temp_path)
        return {"detections": detections}
    except Exception as e:
        return {"error": str(e)}
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
