// src/comandos/mod/kick.js
import User from "../../database/models/User.js";
import { aviso } from "../../utils/format.js";
import userTarget from "../../utils/userTarget.js";

export const name      = "kick";
export const aliases   = ["expulsar", "eli"];
export const onlyAdmin = false;
export const onlyMod   = true;
export const onlyOwner = false;

const numFromJid = (jid) => jid?.split("@")[0] || jid;

export const run = async (contexto) => {
  const { reply, react, sender, from, sock } = contexto;

  const objetivo = await userTarget(contexto, User);
  if (!objetivo || objetivo === sender) return reply(aviso("Menciona al usuario o escribe su personaje que quieres expulsar.\n       𝄄   _Uso: !kick @usuario_"));

  const dbGlobal = await User.findOne({ jid: objetivo, permisos: 3 }).select("permisos").lean();
  if (dbGlobal?.permisos === 3) { await react("🚫"); return reply(aviso("No puedes expulsar a un *Owner*.")); }

  const dbLocal = await User.findOne({ jid: objetivo, groupId: from }).select("personaje").lean();

  try {
    await sock.groupParticipantsUpdate(from, [objetivo], "remove");
    await react("✅");
    await reply(aviso(`*${dbLocal?.personaje || "@" + numFromJid(objetivo)}* fue expulsado del grupo. 🚪`), [objetivo]);
  } catch (_) {
    await reply(aviso("No pude expulsar al usuario. ¿Tengo permisos de admin?"));
  }
};
