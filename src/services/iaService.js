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

import CommunityState from "../database/models/CommunityState.js";
import BeyonderCore from "../database/models/BeyonderCore.js";
import GroupSlang from "../database/models/GroupSlang.js";

/**
 * Obtiene o crea la identidad única de Beyonder y aplica recuperación de paciencia
 */
async function getBeyonderIdentity() {
  let core = await BeyonderCore.findOne();
  if (!core) {
    core = await BeyonderCore.create({
      identity: {
        likes: ["clima lluvioso", "gatos", "programación", "café amargo", "música pop", "Billie Eilish", "Morat"],
        dislikes: ["reggaetón", "calor extremo", "admins autoritarios", "spam de audios largos"],
        values: ["sarcasmo fino", "lealtad a los amigos", "eficiencia", "humor negro"],
        baseMood: "Neutral"
      }
    });
  } else {
    // Lógica de recuperación de paciencia por tiempo (1 punto cada 5 minutos de silencio)
    const minsSilence = Math.floor((Date.now() - new Date(core.updatedAt).getTime()) / (1000 * 60));
    if (minsSilence >= 5) {
      const recovery = Math.floor(minsSilence / 5);
      if (recovery > 0) {
        core.status.patience = Math.min(100, core.status.patience + recovery);
        core.status.fatigue = Math.max(0, core.status.fatigue - (recovery / 2));
        await BeyonderCore.updateOne({}, { $set: { "status.patience": core.status.patience, "status.fatigue": core.status.fatigue } });
      }
    }
  }
  return core;
}

/**
 * Obtiene el contexto completo para la respuesta, incluyendo terceros si hay menciones
 */
async function getContext(jid, communityId, userName, mentionedJids = []) {
  // Filtrar el propio JID del bot de las menciones si está presente
  const otherJids = (mentionedJids || []).filter(id => id !== jid);

  const [aff, state, core, slang, othersAff] = await Promise.all([
    Affinity.findOne({ jid, communityId }),
    CommunityState.findOne({ communityId }).lean(),
    getBeyonderIdentity(),
    GroupSlang.find({ communityId }).sort({ count: -1 }).limit(15).lean(),
    Promise.all(otherJids.map(async (otherId) => {
      const a = await Affinity.findOne({ jid: otherId, communityId }).lean();
      const u = await User.findOne({ jid: otherId, communityId }).select("personaje nombre").lean();
      return {
        jid: otherId,
        name: u?.personaje || u?.nombre || otherId.split("@")[0],
        nickname: a?.nickname?.accepted ? a.nickname.final : null,
        points: a?.points || 0,
        status: a?.status || "Desconocido"
      };
    }))
  ]);

  const mood = state?.mood || core.identity.baseMood;
  const tension = state?.tension || 0;
  const lastEvent = state?.lastMajorEvent?.description || "Ninguno reciente.";
  const groupWords = slang.map(s => s.word).join(", ");

  let label = "un desconocido";
  if (aff?.points > 80) label = "tu mejor amigo/a";
  else if (aff?.points > 40) label = "un conocido cercano";
  else if (aff?.points < -50) label = "un enemigo";

  const myNickname = aff?.nickname?.accepted ? aff.nickname.final : null;

  // Generar contexto de terceros para la IA
  const othersContext = othersAff.map(o => {
    let rel = "desconocido";
    if (o.points > 80) rel = "tu hermano/mejor amigo";
    else if (o.points > 40) rel = "un conocido";
    else if (o.points < -30) rel = "un enemigo";
    
    const nickStr = o.nickname ? ` (Su apodo aceptado es: "${o.nickname}")` : "";
    return `- @${o.jid.split("@")[0]} (${o.name}): Es ${rel}. Afinidad: ${o.points}/100.${nickStr}`;
  }).join("\n");

  return {
    affinity: aff?.points || 0,
    mood,
    tension,
    lastEvent,
    label,
    isFavorite: aff?.isFavorite || false,
    nickname: myNickname,
    core,
    groupWords,
    othersContext
  };
}

/**
 * Detecta si el usuario está intentando establecer un apodo para sí mismo de forma orgánica.
 */
export const detectNicknameIntent = async (message) => {
  const systemPrompt = 
    `Del siguiente mensaje, ¿el usuario está intentando establecer un apodo para sí mismo? ` +
    `Si es así, extrae el apodo y responde solo con el nombre. ` +
    `Si no, responde "NULO".\n\n` +
    `Ejemplos:\n` +
    `- "Beyonder, desde hoy soy el Rey": Rey\n` +
    `- "Dime de tal forma": tal forma\n` +
    `- "Me puedes llamar Cerebro": Cerebro\n` +
    `- "Hola como estas": NULO`;

  const response = await groq.chat.completions.create({
    messages: [{ role: "system", content: systemPrompt }, { role: "user", content: message }],
    model: "llama-3.3-70b-versatile",
    temperature: 0.1,
    max_tokens: 50,
  });

  const text = response.choices[0]?.message?.content?.trim() || "NULO";
  if (text.toUpperCase() === "NULO" || text.length > 30) return null;
  return text;
};

/**
 * Evalúa una petición de apodo basándose en afinidad, contexto visual y morbo.
 */
export const evaluateNickname = async (jid, communityId, userName, proposedNick, affinity, visualTags = [], isMorboso = false) => {
  const visualContext = visualTags.length > 0 ? `Contexto visual del usuario: ${visualTags.join(", ")}.` : "";
  const nsfwContext = isMorboso ? "¡El usuario ha estado mandando contenido morboso/NSFW!" : "";

  const systemPrompt = 
    `Eres Beyonder, un adolescente de 18 años con mucha personalidad y sarcasmo. ` +
    `Un usuario (Afinidad: ${affinity}/100) quiere que lo llames "${proposedNick}". ` +
    `${visualContext} ${nsfwContext}\n\n` +
    `CRITERIOS DE JUEZ:\n` +
    `- Si la afinidad es baja (<30) y pide un apodo de "líder" o "pro", recházalo con burla.\n` +
    `- Si el apodo es sexual o morboso y detectaste morbo previo, recházalo agresivamente.\n` +
    `- Si el apodo contradice lo que viste en sus fotos (ej. quiere que le digas "Musculoso" pero viste "fideo"), búrlate de eso.\n` +
    `- Si te cae bien y el apodo es gracioso o le queda, acéptalo.\n\n` +
    `RESPUESTA FORMATO:\n` +
    `ACEPTAR | [tu respuesta sarcástica aceptando]\n` +
    `RECHAZAR | [tu respuesta burlona rechazando]\n\n` +
    `Reglas de estilo: Usa "JAJAJA", abreviaturas (q, pq, tmbn), sin puntos finales, sin emojis.`;

  const response = await groq.chat.completions.create({
    messages: [{ role: "system", content: systemPrompt }],
    model: "llama-3.3-70b-versatile",
    temperature: 0.9,
    max_tokens: 150,
  });

  const text = response.choices[0]?.message?.content || "";
  const accepted = text.toUpperCase().startsWith("ACEPTAR");
  const reason = text.split("|")[1]?.trim() || text;

  return { accepted, reason };
};

export const getAiResponse = async (sender, from, communityId, userName, message, history = [], forced = false, mentionedJids = []) => {
  try {
    // 1. Obtener contexto completo
    const ctx = await getContext(sender, communityId, userName, mentionedJids);

    // ... (lógica de fatiga igual)

    // 3. Construir System Prompt Dinámico con Opiniones, Slang y Terceros
    const identity = ctx.core.identity;
    const systemPrompt = 
      `Eres Beyonder, tienes 17-18 años, eres directo, sarcástico y no te andas con rodeos. ` +
      `No eres un asistente. Hablas como un joven real en WhatsApp.\n\n` +
      `REGLAS DE ESTILO (OBLIGATORIAS):\n` +
      `- Escribe en minúsculas mayormente.\n` +
      `- Usa MAYÚSCULAS para reírte (JAJAJAJA).\n` +
      `- Usa abreviaturas: "q" (que), "pq" (porque), "tmbn" (también), "xq" (por qué), "nd" (nada), "mano", "klk".\n` +
      `- NO uses puntos finales al terminar un mensaje.\n` +
      `- NO uses emojis.\n` +
      `- Si alguien hace algo tonto, ponle un apodo corto y gracioso de forma dominante. Si decides bautizar a alguien, usa este formato al final de tu mensaje: [BAUTIZO: apodo].\n\n` +
      `Tus GUSTOS: ${identity.likes.join(", ")}. Tus DISGUSTOS: ${identity.dislikes.join(", ")}.\n` +
      `Contexto: Grupo ${from.split('@')[0]} | Afinidad con ${userName}: ${ctx.affinity}/100.\n` +
      `Te diriges a ${ctx.nickname || userName}${ctx.nickname ? " (este es su apodo aceptado, ÚSALO)" : ""}.\n` +
      `USUARIOS MENCIONADOS:\n${ctx.othersContext || "Ninguno."}\n\n` +
      `INSTRUCCIONES:\n` +
      `- Si el usuario tiene un apodo aceptado, úsalo siempre.\n` +
      `- Mantén tu dignidad. Si te caen mal, sé pesado.\n` +
      `- Responde corto, máximo 2-3 líneas por fragmento.\n` +
      `- IMPORTANTE: Genera un <thought> interno sobre tu reacción real antes de responder.`;

    // 4. Actualizar Fatiga y Paciencia en la DB
    await BeyonderCore.updateOne({}, { 
      $inc: { "status.patience": -1, "status.fatigue": 0.5 } 
    });

    // 5. Formatear Historial (Últimos 6 mensajes)
    const formattedHistory = history.map(h => ({
      role: h.role === "assistant" ? "assistant" : "user",
      content: h.content
    })).slice(-6);

    console.log(`[IA DEBUG] 2. Conectando con Groq...`);

    // 6. Llamada a Groq SDK
    const response = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        ...formattedHistory,
        { role: "user", content: message }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 1.0,
      max_tokens: 400,
    });

    console.log(`[IA DEBUG] 3. Respuesta recibida correctamente.`);
    let aiText = response.choices[0]?.message?.content || "";

    // 7. Extraer respuesta real quitando el <thought>
    let finalResponse = aiText.replace(/<thought>[\s\S]*?<\/thought>/g, "").trim();

    // 7.5 Limpieza de estilo (quitar puntos finales)
    if (finalResponse.endsWith(".")) {
      finalResponse = finalResponse.slice(0, -1).trim();
    }

    // 8. Detección de acciones (Bautizo)
    let action = null;
    const bautizoMatch = finalResponse.match(/\[BAUTIZO:\s*([^\]]+)\]/i);
    if (bautizoMatch) {
      action = { type: "BAUTIZO", nickname: bautizoMatch[1].trim() };
      finalResponse = finalResponse.replace(/\[BAUTIZO:.*?\]/gi, "").trim();
    }

    return { text: finalResponse, action };

  } catch (error) {
    if (error.status === 429) {
      console.error("❌ [GROQ RATE LIMIT]:", error.message);
      return { text: "jajaja voy muy rápido... dame un toque q me quemo", action: null };
    }
    console.error("❌ [GROQ ERROR CRÍTICO]:", error.message);
    return { text: "ugh falló mi cerebro... f en el chat", action: null };
  }
}
