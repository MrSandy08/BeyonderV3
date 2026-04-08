// src/comandos/general/rechazar.js
import User from "../../database/models/User.js";
import { solicitudes } from "../../store/solicitudes.js";
import { aviso } from "../../utils/format.js";

export const name      = "rechazar";
export const aliases   = ["rechazo"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

const numFromJid   = (jid) => jid?.split("@")[0] || jid;
const primerNombre = (n)   => n?.split(" ")[0] || n || "???";

export const run = async (contexto) => {
  const { sender, from, sock, msg, react, communityId } = contexto;

  let matchKey = null, solicitud = null;
  for (const [key, val] of solicitudes) {
    if (key.startsWith(from) && val.pendientes.has(sender)) { matchKey = key; solicitud = val; break; }
  }

  if (!solicitud) return sock.sendMessage(from, { text: aviso("No tienes ninguna propuesta pendiente.") }, { quoted: msg });

  clearTimeout(solicitud.timer);
  solicitudes.delete(matchKey);
  await react("🥀");

  const miUsuario    = await User.findOne({ jid: sender, communityId }).lean();
  const senderUser   = await User.findOne({ jid: solicitud.sender, communityId }).lean();
  const miNombre     = primerNombre(miUsuario?.personaje    || numFromJid(sender));
  const senderNombre = primerNombre(senderUser?.personaje   || numFromJid(solicitud.sender));

  await sock.sendMessage(from, {
    text: aviso(`*${miNombre}* rechazó la propuesta de *${senderNombre}*. 🥀\n       𝄄   _A veces el destino tiene otros planes..._`),
    mentions: [sender, solicitud.sender],
  }, { quoted: msg });
};
