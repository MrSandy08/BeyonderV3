// src/services/iaService.js
import Groq from "groq-sdk";
import Affinity from "../database/models/Affinity.js";

// Configuración de Groq SDK
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Variable global de fatiga
let globalFatigue = 0;

/**
 * Incrementa la fatiga global
 */
export const addFatigue = (points) => {
  globalFatigue = Math.min(100, globalFatigue + points);
  console.log(`[FATIGA] +${points} | Total: ${globalFatigue}`);
};

/**
 * Reduce la fatiga cada 5 minutos
 */
setInterval(() => {
  if (globalFatigue > 0) {
    globalFatigue = Math.max(0, globalFatigue - 5);
    console.log(`[FATIGA] Recuperación: -5 | Total: ${globalFatigue}`);
  }
}, 5 * 60 * 1000);

/**
 * Obtiene la afinidad de un usuario
 */
async function getAffinityContext(userId, groupId, userName) {
  let aff = await Affinity.findOne({ userId, groupId });
  if (!aff) {
    aff = await Affinity.create({ userId, groupId });
  }
  return `Estás hablando con ${userName}, tu relación es ${aff.status} y tu nivel de afinidad es ${aff.points}.`;
}

export const getAiResponse = async (sender, from, userName, message, history = [], forced = false) => {
  try {
    console.log(`[IA DEBUG] 1. Iniciando petición para ${userName} (@${sender.split('@')[0]})`);
    console.log(`[IA DEBUG] API Key presente: ${!!process.env.GROQ_API_KEY}`);
    
    if (!message) {
      console.log("[IA DEBUG] Mensaje vacío, abortando.");
      return { text: null, action: null };
    }

    // 1. Obtener afinidad para personalizar respuesta
    const affinityData = await Affinity.findOne({ jid: sender, groupId: from }).lean();
    const affinity = affinityData?.level || 0;

    // 2. Construir System Prompt Dinámico
    const systemPrompt = 
      `Eres Beyonder, un bot de WhatsApp avanzado con una personalidad neutral, eficiente y ligeramente sarcástica. ` +
      `Te diriges a ${userName}. Tu nivel de afinidad con este usuario es de ${affinity}/100. ` +
      `Si la afinidad es alta (>70), puedes ser más cercano, atrevido o incluso un poco morboso si el contexto lo permite. ` +
      `Si es baja (<30), mantente frío, distante y profesional. ` +
      `Responde siempre de forma concisa (máximo 2-3 párrafos). No uses emojis. ` +
      `IMPORTANTE: Si el usuario te pide algo violento o prohibido, recházalo con elegancia y sarcasmo.`;

    // 3. Formatear Historial (Últimos 6 mensajes)
    const formattedHistory = history.map(h => ({
      role: h.role === "assistant" ? "assistant" : "user",
      content: h.content
    })).slice(-6);

    console.log(`[IA DEBUG] 2. Conectando con Groq (Modelo: llama3-8b-8192)...`);

    // 4. Llamada a Groq SDK
    const response = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        ...formattedHistory,
        { role: "user", content: message }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 1.0,
      max_tokens: 300,
    });

    console.log(`[IA DEBUG] 3. Respuesta recibida correctamente.`);
    let aiText = response.choices[0]?.message?.content || "";

    // 5. Detección de acciones
    let action = null;
    if (/patear|pateo|patearé|voy a patear/i.test(aiText)) {
      action = "tackled";
    }

    return { text: aiText, action };

  } catch (error) {
    if (error.status === 429) {
      console.error("❌ [GROQ RATE LIMIT]:", error.message);
      return { text: "¡Vaya! Voy demasiado rápido... incluso para mis estándares. 😏 Dame un momento para respirar e intenta de nuevo.", action: null };
    }
    console.error("❌ [GROQ ERROR CRÍTICO]:", error.message);
    return { text: "Ugh, hubo un fallo al conectar con mi cerebro (Groq). Tal vez mis circuitos se sobrecalentaron pensando en ti. 😏", action: null };
  }
}
