// src/comandos/owner/desmod.js
import User from "../../database/models/User.js";
import { aviso } from "../../utils/format.js";
import userTarget from "../../utils/userTarget.js";

export const name      = "desmod";
export const aliases   = ["quitar-mod", "unmod"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = true;

const numFromJid = (jid) => jid?.split("@")[0] || jid;

export const run = async (contexto) => {
  const { reply, react, sock, from, sender, communityId } = contexto;

  const objetivo = await userTarget(contexto, User);
  if (!objetivo) return reply(aviso("Menciona al usuario o escribe su personaje que quieres quitar de Mod.\n       𝄄   _Uso: !desmod @usuario_"));

  // Verificar si es Owner global
  const isGlobalOwner = contexto.config.OWNERS.includes(objetivo) || 
                        (await User.findOne({ jid: objetivo, communityId, permisos: 3 }).lean());

  if (isGlobalOwner) return reply(aviso("No puedes quitar el rango a un Owner."));

  const dbUser = await User.findOne({ jid: objetivo, communityId }).select("permisos").lean();
  if (!dbUser || dbUser.permisos < 2) return reply(aviso(`*@${numFromJid(objetivo)}* no es Moderador.`), [objetivo]);

  // Quitar permisos globalmente
  await User.findOneAndUpdate({ jid: objetivo, communityId }, { $set: { permisos: 0 } });
  
  // Quitar admin en WhatsApp
  await sock.groupParticipantsUpdate(from, [objetivo], "demote").catch(() => {});

  await react("✅");
  await reply(aviso(`*@${numFromJid(objetivo)}* ya no es Moderador. 🛡️`), [objetivo]);
};
