import axios from "axios";

/**
 * SERVICIO DE DESCARGAS MULTIMEDIA (Cobalt API)
 * Soporta YouTube, TikTok, Instagram y más.
 */

const COBALT_API_URL = "https://api.cobalt.tools/api/json";

/**
 * Descarga multimedia usando la API de Cobalt.
 * @param {string} url - URL del video/audio.
 * @param {string} mode - 'audio' o 'video'.
 * @returns {Promise<{success: boolean, buffer?: Buffer, filename?: string, error?: string}>}
 */
export const downloadCobalt = async (url, mode = "audio") => {
  try {
    // 1. Petición a la API de Cobalt
    const { data } = await axios.post(
      COBALT_API_URL,
      {
        url: url,
        downloadMode: mode,
        audioFormat: "mp3",
        videoQuality: "720",
      },
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    if (data.status === "error") {
      throw new Error(data.text || "Error en la API de Cobalt");
    }

    if (!data.url) {
      throw new Error("No se recibió una URL de descarga de Cobalt");
    }

    // 2. Descargar el archivo directamente a memoria (buffer)
    const response = await axios.get(data.url, {
      responseType: "arraybuffer",
    });

    const buffer = Buffer.from(response.data);
    const filename = data.filename || `cobalt_${Date.now()}.${mode === "audio" ? "mp3" : "mp4"}`;

    return {
      success: true,
      buffer,
      filename,
    };
  } catch (error) {
    console.error("❌ [Cobalt Error]:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.text || error.message,
    };
  }
};

/**
 * Detecta si una URL es compatible con Cobalt (YouTube, TikTok, Instagram, etc.)
 * @param {string} url 
 * @returns {boolean}
 */
export const isCobaltUrl = (url) => {
  const regex = /youtube\.com|youtu\.be|tiktok\.com|instagram\.com|twitter\.com|x\.com|facebook\.com/i;
  return regex.test(url);
};
