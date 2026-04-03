/**
 * detector.js — Cliente HTTP para el servidor de IA (FastAPI)
 * Envía imágenes al servidor local para análisis ultra rápido.
 */
import axios from 'axios';
import FormData from 'form-data';

// ── CONFIGURACIÓN INTERNA (HUGGING FACE) ─────────────────────────────────────
const AI_SERVER_URL = `http://127.0.0.1:7860/detect`;
const AI_NSFW_URL   = `http://127.0.0.1:7860/detect/nsfw`;
const AI_GORE_URL   = `http://127.0.0.1:7860/detect/gore`;

// ── CONFIGURACIÓN DE UMBRALES (NudeNet) ──────────────────────────────────────
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

/**
 * Escanea una imagen solo en busca de NSFW (NudeNet)
 */
export async function scanNsfw(buffer) {
  try {
    const form = new FormData();
    form.append('file', buffer, { filename: 'image.jpg' });

    const response = await axios.post(AI_NSFW_URL, form, {
      headers: { ...form.getHeaders() },
      timeout: 30000 
    });

    const result = response.data;
    if (result.error) return { isNsfw: false, error: result.error };

    const detections = result.nsfw || [];
    let isNsfw = false;
    let maxScore = 0;
    let detectedClass = null;
    let immediateDelete = false;

    for (const det of detections) {
      const { class: className, score } = det;
      const threshold = NSFW_THRESHOLDS[className] || 0.70;

      if (score >= threshold) {
        isNsfw = true;
        if (score > maxScore) {
          maxScore = score;
          detectedClass = className;
        }
        if (className.includes('GENITALIA') || className.includes('PHALLUS') || className.includes('VULVA') || className.includes('ANUS')) {
          immediateDelete = true;
        }
      }
    }

    return { isNsfw, score: maxScore, detectedClass, immediateDelete };
  } catch (error) {
    console.error("❌ Error scanNsfw:", error.message);
    return { isNsfw: false, error: error.message };
  }
}

/**
 * Escanea una imagen solo en busca de Gore (CLIP)
 */
export async function scanGore(buffer) {
  try {
    const form = new FormData();
    form.append('file', buffer, { filename: 'image.jpg' });

    const response = await axios.post(AI_GORE_URL, form, {
      headers: { ...form.getHeaders() },
      timeout: 30000 
    });

    const result = response.data;
    if (result.error) return { isGore: false, error: result.error };

    // CLIP también puede detectar NSFW como backup
    const isPornBackup = result.is_porn_clip && result.porn_confidence > 0.80;

    return { 
      isGore: result.is_gore || result.confidence > 0.60, 
      goreScore: result.confidence,
      isNsfwBackup: isPornBackup,
      nsfwBackupScore: result.porn_confidence
    };
  } catch (error) {
    console.error("❌ Error scanGore:", error.message);
    return { isGore: false, error: error.message };
  }
}

/**
 * Analiza una imagen enviándola al servidor FastAPI.
 * Mantiene compatibilidad con el código anterior.
 */
export async function analyzeImage(buffer) {
  try {
    const form = new FormData();
    form.append('file', buffer, { filename: 'image.jpg' });

    const response = await axios.post(AI_SERVER_URL, form, {
      headers: { ...form.getHeaders() },
      timeout: 30000 
    });

    const result = response.data;
    if (result.error) {
      console.error("Error en servidor IA (HF):", result.error);
      return { isNsfw: false, isGore: false, error: result.error };
    }

    const nsfwDetections = result.nsfw || [];
    const goreResult = result.gore || { is_gore: false, confidence: 0 };
    const pornClipResult = result.porn_clip || { is_porn: false, confidence: 0 };
    
    let isNsfw = false;
    let maxNsfwScore = 0;
    let detectedClass = null;
    let immediateDelete = false;

    // 1. Procesar detecciones NudeNet (NSFW)
    for (const det of nsfwDetections) {
      const { class: className, score } = det;
      const threshold = NSFW_THRESHOLDS[className] || 0.70;

      if (score > 0.10) {
        console.log(`[DEBUG IA] Clase: ${className} | Score: ${score.toFixed(4)} | Threshold: ${threshold}`);
      }

      if (score >= threshold) {
        isNsfw = true;
        if (score > maxNsfwScore) {
          maxNsfwScore = score;
          detectedClass = className;
        }

        if (className.includes('GENITALIA') || className.includes('PHALLUS') || className.includes('VULVA') || className.includes('ANUS')) {
          immediateDelete = true;
        }
      }
    }

    // 2. Procesar Detección CLIP Extra (Pornografía)
    if (pornClipResult.is_porn && pornClipResult.confidence > 0.60) {
      isNsfw = true;
      if (pornClipResult.confidence > maxNsfwScore) {
        maxNsfwScore = pornClipResult.confidence;
        detectedClass = "CLIP_NSFW_PROBABLE";
      }
      console.log(`[DEBUG CLIP] NSFW Detectado por CLIP | Score: ${pornClipResult.confidence.toFixed(4)}`);
    }

    const goreScore = typeof goreResult.confidence === 'number' ? goreResult.confidence : 0;

    return {
      isNsfw,
      nsfwScore: maxNsfwScore,
      detectedClass,
      immediateDelete,
      isGore: goreResult.is_gore || goreScore > 0.50,
      goreScore: goreScore,
      isAnime: false
    };
  } catch (error) {
    console.error("Error conectando con Hugging Face Space:", error.message);
    return { isNsfw: false, isGore: false, error: error.message };
  }
}

// Mantener compatibilidad
export const detectNsfw = async (buffer) => {
  const res = await analyzeImage(buffer);
  return { isNsfw: res.isNsfw, confidence: res.nsfwScore, detectedClass: res.detectedClass, immediateDelete: res.immediateDelete };
};

export const detectGore = async (buffer) => {
  const res = await analyzeImage(buffer);
  return { isGore: res.isGore, proportion: res.goreScore };
};
