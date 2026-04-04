import { parentPort, workerData } from 'worker_threads';
import sharp from 'sharp';
import axios from 'axios';
import FormData from 'form-data';

// Los workers no comparten el scope de importaciones normales de la misma forma si no se configuran,
// pero aquí usaremos importaciones directas.

const NSFW_THRESHOLDS = {
  'FEMALE_GENITALIA_EXPOSED': 0.85, // Umbral elevado a 0.85 para mayor precisión
  'MALE_GENITALIA_EXPOSED':   0.85,
  'ANUS_EXPOSED':             0.85,
  'PHALLUS_EXPOSED':          0.85,
  'VULVA_EXPOSED':            0.85,
  'PUBIC_HAIR_EXPOSED':       0.85,
  'FEMALE_BREAST_EXPOSED':    0.90, // Pechos expuestos necesitan más confianza
  'BREAST_EXPOSED':           0.90,
  'BUTTOCKS_EXPOSED':         0.85,
};

const HF_SPACE_URL = process.env.HF_SPACE_URL || 'http://127.0.0.1:7860';
const HF_TOKEN = process.env.HF_TOKEN; // Opcional, por si el Space es privado

const AI_NSFW_URL = `${HF_SPACE_URL}/detect/nsfw`;
const AI_GORE_URL = `${HF_SPACE_URL}/detect/gore`;

async function processMedia() {
  const { buffer, type } = workerData;
  
  const headers = {
    ...new FormData().getHeaders(),
    ...(HF_TOKEN ? { 'Authorization': `Bearer ${HF_TOKEN}` } : {})
  };

  try {
    // 1. Pre-procesamiento con Sharp (Bajar saturación 10% para NudeNet)
    const smallBuffer = await sharp(buffer)
      .resize(300, 300, { fit: 'inside' })
      .modulate({ brightness: 1.0, contrast: 1.2, saturation: 0.9 }) 
      .toFormat('jpeg')
      .toBuffer();

    // 2. Prioridad: NudeNet (NSFW) primero
    const nsfwForm = new FormData();
    nsfwForm.append('file', smallBuffer, { filename: 'image.jpg' });
    
    const nsfwRes = await axios.post(AI_NSFW_URL, nsfwForm, {
      headers: { ...nsfwForm.getHeaders(), ...headers },
      timeout: 30000
    });

    const nsfwData = nsfwRes.data;
    let nsfwDetected = false;
    let detectedClass = null;
    let maxScore = 0;

    if (nsfwData.nsfw) {
      for (const det of nsfwData.nsfw) {
        if (det.score > maxScore) maxScore = det.score;
        if (det.score >= 0.65) { // Umbral de duda mínimo
          nsfwDetected = true;
          detectedClass = det.class;
          // No hacemos break para encontrar el maxScore real
        }
      }
    }

    // 3. Validación Semántica Cruzada con CLIP
    const goreForm = new FormData();
    goreForm.append('file', smallBuffer, { filename: 'image.jpg' });
    
    const goreRes = await axios.post(AI_GORE_URL, goreForm, {
      headers: { ...goreForm.getHeaders(), ...headers },
      timeout: 30000
    });

    const clipData = goreRes.data;

    // LÓGICA DE CAPAS (NSFW)
    let finalStatus = 'clean';
    let finalType = null;
    let finalScore = maxScore;
    let isDoubt = false;

    if (nsfwDetected) {
      // Ajuste de umbral por Artwork/Dibujo
      const baseThreshold = clipData.is_artwork ? 0.95 : 0.85;
      
      if (maxScore >= baseThreshold && !clipData.is_false_positive) {
        finalStatus = 'detected';
        finalType = 'NSFW';
      } else if (maxScore >= 0.65 && !clipData.is_false_positive) {
        // CAPA DE DUDA (70% - 85%)
        isDoubt = true;
        finalStatus = 'doubt';
        finalType = 'NSFW';
      }
    }

    // LÓGICA GORE (Si no hubo NSFW)
    if (finalStatus === 'clean' && clipData.is_gore) {
      finalStatus = 'detected';
      finalType = 'GORE';
      finalScore = clipData.gore_confidence;
    }

    return parentPort.postMessage({ 
      status: finalStatus, 
      type: finalType, 
      score: finalScore,
      detectedClass,
      isArtwork: clipData.is_artwork,
      isDoubt
    });

  } catch (error) {
    console.error(`❌ [Worker IA Error]: ${error.response?.data?.error || error.message}`);
    parentPort.postMessage({ status: 'error', error: error.message });
  }
}

processMedia();
