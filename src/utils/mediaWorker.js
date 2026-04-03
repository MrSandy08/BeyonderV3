import { parentPort, workerData } from 'worker_threads';
import sharp from 'sharp';
import axios from 'axios';
import FormData from 'form-data';

// Los workers no comparten el scope de importaciones normales de la misma forma si no se configuran,
// pero aquí usaremos importaciones directas.

const NSFW_THRESHOLDS = {
  'FEMALE_GENITALIA_EXPOSED': 0.30,
  'MALE_GENITALIA_EXPOSED':   0.30,
  'ANUS_EXPOSED':             0.30,
  'PHALLUS_EXPOSED':          0.30,
  'VULVA_EXPOSED':            0.30,
  'PUBIC_HAIR_EXPOSED':       0.30,
  'FEMALE_BREAST_EXPOSED':    0.50,
  'BREAST_EXPOSED':           0.50,
  'COVERED_GENITALIA':        0.80,
  'COVERED_BREASTS':          0.80,
  'COVERED_BUTTOCKS':         0.80,
  'BUTTOCKS_EXPOSED':         0.60,
  'MALE_BREAST_EXPOSED':      0.80,
};

const AI_NSFW_URL = 'http://127.0.0.1:7860/detect/nsfw';
const AI_GORE_URL = 'http://127.0.0.1:7860/detect/gore';

async function processMedia() {
  const { buffer, type } = workerData;
  
  try {
    // 1. Pre-procesamiento con Sharp (Reducir a 300x300)
    // Esto ahorra CPU en los modelos de IA y reduce el payload HTTP
    const smallBuffer = await sharp(buffer)
      .resize(300, 300, { fit: 'inside' })
      .toFormat('jpeg')
      .toBuffer();

    // 2. Prioridad: NudeNet (NSFW) primero
    const nsfwForm = new FormData();
    nsfwForm.append('file', smallBuffer, { filename: 'image.jpg' });
    
    const nsfwRes = await axios.post(AI_NSFW_URL, nsfwForm, {
      headers: { ...nsfwForm.getHeaders() },
      timeout: 20000
    });

    const nsfwData = nsfwRes.data;
    let isNsfw = false;
    let detectedClass = null;
    let immediateDelete = false;

    if (nsfwData.nsfw) {
      for (const det of nsfwData.nsfw) {
        const threshold = NSFW_THRESHOLDS[det.class] || 0.70;
        if (det.score >= threshold) {
          isNsfw = true;
          detectedClass = det.class;
          if (det.class.includes('GENITALIA') || det.class.includes('PHALLUS')) immediateDelete = true;
          break;
        }
      }
    }

    if (isNsfw) {
      return parentPort.postMessage({ 
        status: 'detected', 
        type: 'NSFW', 
        detectedClass, 
        immediateDelete 
      });
    }

    // 3. Solo si NudeNet es negativo, ejecutar CLIP (Gore)
    const goreForm = new FormData();
    goreForm.append('file', smallBuffer, { filename: 'image.jpg' });
    
    const goreRes = await axios.post(AI_GORE_URL, goreForm, {
      headers: { ...goreForm.getHeaders() },
      timeout: 20000
    });

    const goreData = goreRes.data;
    if (goreData.is_gore || (goreData.confidence > 0.60)) {
      return parentPort.postMessage({ 
        status: 'detected', 
        type: 'GORE', 
        confidence: goreData.confidence 
      });
    }

    // Si llegamos aquí, todo está limpio
    parentPort.postMessage({ status: 'clean' });

  } catch (error) {
    parentPort.postMessage({ status: 'error', error: error.message });
  }
}

processMedia();
