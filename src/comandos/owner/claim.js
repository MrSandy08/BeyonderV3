// src/comandos/owner/claim.js
import User from "../../database/models/User.js";
import { aviso } from "../../utils/format.js";

export const name      = "claim";
export const aliases   = [];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

const OWNER_PASSWORD = process.env.OWNER_PASSWORD || "RY18VC";
const MAX_OWNERS     = 3;

export const run = async (contexto) => {
  const { sender, from, args, sock, msg, react } = contexto;

  await sock.sendMessage(from, { delete: msg.key }).catch(() => {});

  const pass = args[0]?.trim();
  if (!pass || pass !== OWNER_PASSWORD) { await react("🚫"); return; }

  const dbUser = await User.findOne({ jid: sender, permisos: 3 }).select("permisos").lean();
  if (dbUser?.permisos === 3) { await react("👑"); return; }

  const uniqueOwners = await User.distinct("jid", { permisos: 3 });
  if (uniqueOwners.length >= MAX_OWNERS) {
    return sock.sendMessage(from, {
      text: aviso(`Acceso denegado. Ya hay *${MAX_OWNERS} owners* en el sistema. Capacidad máxima alcanzada.`),
    }, { quoted: msg });
  }

  // Se registra como owner en el grupo actual, lo que lo hace global
  await User.findOneAndUpdate({ jid: sender, groupId: from }, { $set: { permisos: 3 } }, { upsert: true });
  await react("👑");
  await sock.sendMessage(from, { text: aviso("*Acceso concedido.* Nuevo Owner registrado. Bienvenido al mando. 👑") }, { quoted: msg });
};
