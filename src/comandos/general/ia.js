// src/comandos/general/ia.js
import { getAiResponse } from "../../services/iaService.js";
import { chatHistories } from "../../events/messages.js";

export const name      = "ia";
export const aliases   = ["beyonder", "chat"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

export const run = async (contexto) => {
  const { reply, sender, from, text, msg, sock, userName } = contexto;

  if (!text) return reply("Dime algo, no seas tímido... 😏");

  await sock.sendPresenceUpdate('composing', from).catch(() => {});
  
  const history = chatHistories.get(from) || [];
  
  // Forzamos la respuesta (100% probabilidad)
  const { text: aiText } = await getAiResponse(sender, from, userName, text, history, true);
  
  // Guardar en historial
  history.push({ role: "user", content: text });
  history.push({ role: "assistant", content: aiText });
  if (history.length > 30) history.splice(0, 2);
  chatHistories.set(from, history);

  // Enviamos la respuesta citando el mensaje
  await sock.sendMessage(from, { text: aiText }, { quoted: msg });
  await sock.sendPresenceUpdate('paused', from).catch(() => {});
};
