// src/comandos/general/apodo.js
import User from "../../database/models/User.js";
import { aviso } from "../../utils/format.js";

export const name      = "apodo";
export const aliases   = [];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

export const run = async (contexto) => {
  const { reply, sender, msg, from } = contexto;

  const rawBody   = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || "").trim();
  const botJid    = contexto.sock.user?.id || "";
  const usuario   = await User.findOne({ jid: sender, groupId: from }).lean();
  const esPareja  = usuario?.parejas?.includes(botJid);

  if (!esPareja) return reply(aviso("Solo mi pareja en este grupo puede ponerme un apodo. 💔"));

  const nuevoApodo = rawBody.replace(/!apodo/i, "").trim();
  if (!nuevoApodo) return reply(aviso("Dime el apodo que quieres ponerme."));

  await User.findOneAndUpdate({ jid: sender, groupId: from }, { $set: { botNickname: nuevoApodo } }, { upsert: true });
  await reply(aviso(`Me encanta. De ahora en adelante, para ti soy *${nuevoApodo}*. ❤️`));
};
