// src/comandos/owner/addowner.js
import User from "../../database/models/User.js";
import { aviso } from "../../utils/format.js";
import userTarget from "../../utils/userTarget.js";

export const name      = "addowner";
export const aliases   = ["añadirowner", "ao"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = true;

const MAX_OWNERS = 3;
const numFromJid = (jid) => jid?.split("@")[0] || jid;

export const run = async (contexto) => {
  const { sender, from, reply, react, communityId } = contexto;

  const objetivo = await userTarget(contexto, User);
  if (!objetivo || objetivo === sender) return reply(aviso("Menciona al usuario o escribe su personaje que deseas hacer Owner."));

  // Verificar si ya es Owner
  const dbUser = await User.findOne({ jid: objetivo, communityId, permisos: 3 }).select("permisos").lean();
  if (dbUser?.permisos === 3) return reply(aviso(`*@${numFromJid(objetivo)}* ya es Owner.`), [objetivo]);

  // Verificar límite máximo
  const currentOwners = await User.distinct("jid", { permisos: 3 });
  if (currentOwners.length >= MAX_OWNERS) {
    return reply(aviso(`Acceso denegado. Ya hay *${MAX_OWNERS} owners* en el sistema. Capacidad máxima alcanzada.`));
  }

  // Registrar como Owner globalmente
  await User.findOneAndUpdate({ jid: objetivo, communityId }, { $set: { permisos: 3, groupId: from } }, { upsert: true });
  await react("👑");
  await reply(aviso(`*@${numFromJid(objetivo)}* ha sido nombrado *Owner* global. Bienvenido al mando. 👑`), [objetivo]);
};
