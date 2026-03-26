/**
 * detector.js — Cliente HTTP para el servidor de IA (FastAPI)
 * Envía imágenes al servidor local para análisis ultra rápido.
 */
import axios from 'axios';
import FormData from 'form-data';

// ── CONFIGURACIÓN INTERNA (HUGGING FACE) ─────────────────────────────────────
const AI_SERVER_URL = `http://127.0.0.1:7860/detect`;

/**
 * Analiza una imagen enviándola al servidor FastAPI en Hugging Face.
 */
export async function analyzeImage(buffer) {
  try {
    const form = new FormData();
    form.append('file', buffer, { filename: 'image.jpg' });

    const response = await axios.post(AI_SERVER_URL, form, {
      headers: { ...form.getHeaders() },
      timeout: 30000 // Aumentado para latencia de red
    });

    const result = response.data;
    if (result.error) {
      console.error("Error en servidor IA (HF):", result.error);
      return { isNsfw: false, isGore: false, error: result.error };
    }

    // Adaptar respuesta del nuevo servidor (CLIP + NudeNet)
    const nsfwDetections = result.nsfw || [];
    const goreResult = result.gore || { is_gore: false, confidence: 0 };
    
    // Clasificación básica NSFW basada en etiquetas comunes de NudeNet
    // NudeNet devuelve una lista de detecciones. Buscamos la de mayor puntuación de desnudez.
    const labelsNSFW = [
      'BUTTOCKS_EXPOSED', 'FEMALE_BREAST_EXPOSED', 'FEMALE_GENITALIA_EXPOSED', 
      'MALE_GENITALIA_EXPOSED', 'ANUS_EXPOSED', 'MALE_BREAST_EXPOSED',
      'PHALLUS_EXPOSED', 'BREAST_EXPOSED', 'VULVA_EXPOSED', 'PUBIC_HAIR_EXPOSED'
    ];
    
    // Log para depuración interna (ver qué está viendo la IA)
    if (nsfwDetections.length > 0) {
      console.log(`[DEBUG IA] Detecciones NudeNet: ${nsfwDetections.map(d => `${d.class}(${(d.score*100).toFixed(0)}%)`).join(', ')}`);
    }

    // Filtrar solo las etiquetas que consideramos NSFW
    const nsfwHits = nsfwDetections.filter(d => labelsNSFW.includes(d.class));
    
    // Obtener el score más alto de las detecciones NSFW
    const maxNsfwScore = nsfwHits.length > 0 
      ? Math.max(...nsfwHits.map(d => d.score)) 
      : 0;

    // Asegurar que Gore Score sea numérico
    const goreScore = typeof goreResult.confidence === 'number' ? goreResult.confidence : 0;

    return {
      isNsfw: maxNsfwScore > 0.70,
      nsfwScore: maxNsfwScore,
      isGore: goreResult.is_gore || goreScore > 0.50,
      goreScore: goreScore,
      isAnime: false,
      threshold: 0.70
    };
  } catch (error) {
    console.error("Error conectando con Hugging Face Space:", error.message);
    return { isNsfw: false, isGore: false, error: error.message };
  }
}

// Mantener compatibilidad
export const detectNsfw = async (buffer) => {
  const res = await analyzeImage(buffer);
  return { isNsfw: res.isNsfw, confidence: res.nsfwScore };
};

export const detectGore = async (buffer) => {
  const res = await analyzeImage(buffer);
  return { isGore: res.isGore, proportion: res.goreScore };
};
