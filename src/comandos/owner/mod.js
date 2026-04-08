// src/comandos/owner/mod.js
import User from "../../database/models/User.js";
import { aviso } from "../../utils/format.js";
import userTarget from "../../utils/userTarget.js";

export const name      = "mod";
export const aliases   = ["setmod", "addmod"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = true;

const numFromJid = (jid) => jid?.split("@")[0] || jid;

export const run = async (contexto) => {
  const { reply, react, sock, from, sender, communityId } = contexto;

  const objetivo = await userTarget(contexto, User);
  if (!objetivo || objetivo === sender) return reply(aviso("Menciona al usuario o escribe su personaje que quieres hacer Mod.\n       𝄄   _Uso: !mod @usuario_"));

  let esAdminWA = false;
  try {
    const meta = await sock.groupMetadata(from);
    const p    = meta.participants.find(p => p.id === objetivo);
    esAdminWA  = p?.admin === "admin" || p?.admin === "superadmin";
  } catch (_) {}

  if (!esAdminWA)
    return reply(aviso(`@${numFromJid(objetivo)} no es admin del grupo. Solo los admins de WhatsApp pueden ser Moderadores.`), [objetivo]);

  const antes = await User.findOne({ jid: objetivo, communityId }).select("permisos personaje").lean();
  
  // Verificar si es Owner global
  const isGlobalOwner = contexto.config.OWNERS.includes(objetivo) || 
                        (await User.findOne({ jid: objetivo, communityId, permisos: 3 }).lean());

  if (isGlobalOwner) return reply(aviso("No puedes cambiar el rango de un Owner."));
  
  if (antes?.permisos === 2) return reply(aviso(`*@${numFromJid(objetivo)}* ya es Moderador.`), [objetivo]);

  // Se registra como mod globalmente
  await User.findOneAndUpdate({ jid: objetivo, communityId }, { $set: { permisos: 2, groupId: from } }, { upsert: true });
  
  // Dar admin en WhatsApp
  await sock.groupParticipantsUpdate(from, [objetivo], "promote").catch(() => {});

  await react("✅");
  await reply(aviso(`*@${numFromJid(objetivo)}* ahora es *Moderador* 🛡️`), [objetivo]);
};
