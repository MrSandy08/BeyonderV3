// src/comandos/general/ia.js
import { getAiResponse } from "../../services/iaService.js";

export const name      = "ia";
export const aliases   = ["beyonder", "chat"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

// Historial local para el comando
const chatHistories = new Map();

export const run = async (contexto) => {
  const { reply, sender, from, body, msg, sock, senderName, communityId } = contexto;
  const text = contexto.args.join(" ") || body;

  if (!text) return reply("Dime algo, no seas tímido... 😏");

  await sock.sendPresenceUpdate('composing', from).catch(() => {});
  
  const history = chatHistories.get(from) || [];
  
  // Forzamos la respuesta (100% probabilidad) - Corregido el orden de argumentos (v4.6)
  const { text: aiText } = await getAiResponse(sender, from, communityId, senderName, text, history, true);
  
  // Guardar en historial
  if (aiText) {
    history.push({ role: "user", content: text });
    history.push({ role: "assistant", content: aiText });
    if (history.length > 30) history.splice(0, 2);
    chatHistories.set(from, history);

    // Enviamos la respuesta citando el mensaje
    await sock.sendMessage(from, { text: aiText }, { quoted: msg });
  }
  
  await sock.sendPresenceUpdate('paused', from).catch(() => {});
};
