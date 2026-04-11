// src/middlewares/intentHandler.js
import config from "../config.js";
import pluginLoader from "../classes/PluginLoader.js";
import Groq from "groq-sdk";
import { redisClient } from "../database/connection.js";
import { isNluActive } from "../dashboard/server.js";

const groq = config.GROQ_API_KEY ? new Groq({ apiKey: config.GROQ_API_KEY }) : null;

/**
 * Beyonder v4.4: Analiza el sentimiento y emoción del mensaje usando Groq.
 */
export const analizarEmocion = async (texto) => {
  if (!groq || !isNluActive()) return null;

  // 1. Intentar cargar desde Caché de Redis para ahorrar tokens
  const cacheKey = `nlu:${Buffer.from(texto.toLowerCase().trim()).toString('base64').slice(0, 32)}`;
  if (redisClient) {
    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);
  }

  const prompt = `Analiza el sentimiento del siguiente mensaje de WhatsApp y responde ÚNICAMENTE con un objeto JSON.
  Mensaje: "${texto}"
  
  Categorías de emoción: "agresivo", "amistoso", "triste", "divertido", "erótico", "neutral".
  Acciones neko.best sugeridas: "slap", "hug", "pat", "cuddle", "smile", "kiss", "laugh".

  Estructura del JSON:
  {
      "emocion": "categoría",
      "accion_neko": "accion",
      "respuesta_texto": "una frase corta acorde a la emoción",
      "intensidad": 1-10
  }`;

  try {
    const chatCompletion = await Promise.race([
      groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama3-8b-8192",
        response_format: { type: "json_object" }
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout Groq")), 3000))
    ]);

    const result = JSON.parse(chatCompletion.choices[0].message.content);

    // Guardar en Caché por 1 hora si es exitoso
    if (redisClient) {
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(result));
    }

    return result;
  } catch (e) {
    console.error("❌ [v4.4] Fallo en análisis emocional Groq:", e.message);
    return null;
  }
};

/**
 * Beyonder v4: NLU & Intent Middleware
 * Decide qué hacer con el mensaje antes de que llegue a los comandos.
 */
export const processIntent = async (texto, isGroup, isAdmin, isOwner) => {
  const body = texto.trim();
  const isCmd = body.startsWith(config.PREFIX);

  // 1. Detección de Comandos Directos
  if (isCmd) {
    const commandName = body.slice(config.PREFIX.length).split(/\s+/)[0].toLowerCase();
    const command = pluginLoader.getCommand(commandName);
    
    if (command) {
      return {
        type: "command",
        name: commandName,
        command: command,
        args: body.split(/\s+/).slice(1)
      };
    }
  }

  // 2. Detección de Ataques o Comportamiento Malicioso (Placeholder)
  if (body.length > 1000) {
    return { type: "attack", reason: "buffer_overflow_attempt" };
  }

  // 3. Charla Casual o IA
  // Si no es comando, podría ser una mención a Beyonder o charla orgánica
  const beyonderMentions = ["beyonder", "beyond", "bot"];
  const isMentioned = beyonderMentions.some(m => body.toLowerCase().includes(m));

  if (isMentioned || !isGroup) {
    return { type: "chat", text: body };
  }

  return { type: "ignore" };
};
