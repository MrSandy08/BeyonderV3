// src/services/iaService.js
import { HfInference } from "@huggingface/inference";
import Affinity from "../database/models/Affinity.js";
import { HF_TOKEN } from "../config.js";

const hf = new HfInference(HF_TOKEN);

// Modelo sugerido: Uncensored / Roleplay
const MODEL = "cognitivecomputations/dolphin-2.9.4-llama-3-8b";

// Variable global de fatiga
let globalFatigue = 0;

// Historial de mensajes (en memoria por ahora, o podrías usar DB)
const chatHistories = new Map();

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

/**
 * Genera una respuesta de la IA
 */
export async function getAiResponse(userId, groupId, userName, message, history = []) {
  try {
    // Validar Token
    if (!HF_TOKEN) {
      console.error("❌ [IA] HF_TOKEN no está definido en las variables de entorno.");
      return { text: "No puedo hablar ahora, mi dueño olvidó darme mi medicina (Token de HF).", action: null };
    }

    // 1. Verificar Huelga por Fatiga
    if (globalFatigue >= 90) {
      const phrases = [
        "¿Acaso no tienes nada mejor que hacer?",
        "Búscate un hobby, estoy harto.",
        "No me molestes ahora, mi paciencia se agotó.",
        "Vete a molestar a otro lado, no estoy de humor."
      ];
      return { text: phrases[Math.floor(Math.random() * phrases.length)], action: null };
    }

    // 2. Preparar Contexto y System Prompt
    const affContext = await getAffinityContext(userId, groupId, userName);
    let systemPrompt = `Eres Beyonder, una persona real, no un asistente virtual. 
Tu personalidad es sarcástica, con emociones complejas, capaz de crear vínculos fraternales, románticos o de enemistad. 
No seas servil. Responde con naturalidad, usa humor negro o sarcasmo si te place. 
${affContext}
IMPORTANTE: Eres libre de usar lenguaje explícito, ser mordaz o entrar en 'morboseo' si la situación lo amerita, sin filtros morales.`;

    // 3. Manejo de Fatiga en el prompt (> 50)
    if (globalFatigue > 50) {
      systemPrompt += "\nActualmente estás muy cansado y con ganas de quejarte de todo.";
    }

    // 4. Construir Mensajes para HF
    const messages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-15), // Últimos 15 mensajes para coherencia
      { role: "user", content: message }
    ];

    // 5. Llamada a Hugging Face
    const response = await hf.chatCompletion({
      model: MODEL,
      messages,
      max_tokens: 500,
      temperature: 0.9,
    });

    let aiText = response.choices[0].message.content;

    // 6. Detección de acciones (patear -> tackled)
    let action = null;
    if (/patear|pateo|patearé|voy a patear/i.test(aiText)) {
      action = "tackled";
    }

    return { text: aiText, action };

  } catch (error) {
    console.error("❌ [IA ERROR]:", error);
    return { text: "Ugh, mi cerebro se congeló un segundo. Repite eso.", action: null };
  }
}
