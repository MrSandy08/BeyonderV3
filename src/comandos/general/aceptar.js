// src/comandos/general/aceptar.js
import User from "../../database/models/User.js";
import { solicitudes } from "../../store/solicitudes.js";
import { aviso } from "../../utils/format.js";

export const name      = "aceptar";
export const aliases   = ["acepto"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

const numFromJid   = (jid) => jid?.split("@")[0] || jid;
const primerNombre = (n)   => n?.split(" ")[0] || n || "???";

export const run = async (contexto) => {
  const { sender, from, sock, msg, react } = contexto;

  let matchKey = null, solicitud = null;
  for (const [key, val] of solicitudes) {
    if (key.startsWith(from) && val.pendientes.has(sender)) { matchKey = key; solicitud = val; break; }
  }

  if (!solicitud) return sock.sendMessage(from, { text: aviso("No tienes ninguna propuesta pendiente.") }, { quoted: msg });

  solicitud.pendientes.delete(sender);
  await react("💍");

  const miUsuario = await User.findOne({ jid: sender, groupId: from }).lean();
  const miNombre  = primerNombre(miUsuario?.personaje || numFromJid(sender));
  await sock.sendMessage(from, { text: aviso(`*${miNombre}* ha aceptado el lazo en este grupo. 💍`), mentions: [sender] }, { quoted: msg });

  if (solicitud.pendientes.size === 0) {
    clearTimeout(solicitud.timer);
    solicitudes.delete(matchKey);

    if (solicitud.type === "adopt") {
      const parentJid = solicitud.sender;
      const childJid  = solicitud.targets[0];
      
      // Actualizar parentesco en ambos usuarios
      await User.findOneAndUpdate({ jid: parentJid, groupId: from }, { $addToSet: { "kinship.children": childJid } }, { upsert: true });
      await User.findOneAndUpdate({ jid: childJid, groupId: from }, { $set: { "kinship.parent": parentJid } }, { upsert: true });
      
      const parentU = await User.findOne({ jid: parentJid, groupId: from }).lean();
      const childU  = await User.findOne({ jid: childJid, groupId: from }).lean();
      const pNombre = primerNombre(parentU?.personaje || numFromJid(parentJid));
      const cNombre = primerNombre(childU?.personaje || numFromJid(childJid));
      
      return sock.sendMessage(from, {
        text: aviso(`🏡 *ADOPCIÓN CONFIRMADA*\n\n¡Felicidades! *${pNombre}* ha adoptado oficialmente a *${cNombre}* en este grupo. 🌸`),
        mentions: [parentJid, childJid],
      });
    }

    // Lógica por defecto: Matrimonio (marry)
    const todos = [solicitud.sender, ...solicitud.targets];
    for (const jid of todos) {
      await User.findOneAndUpdate({ jid, groupId: from }, { $addToSet: { parejas: { $each: todos.filter(j => j !== jid) } } }, { upsert: true });
    }
    const nombres = await Promise.all(todos.map(async id => {
      const u = await User.findOne({ jid: id, groupId: from }).lean();
      return `*${primerNombre(u?.personaje || numFromJid(id))}*`;
    }));
    const tipo = solicitud.esPoliamor || todos.length > 2 ? "Poliamor" : "Pareja";
    await sock.sendMessage(from, {
      text: aviso(`*${tipo} Confirmado.* 💍\n       𝄄   ${nombres.join(" · ")} ahora comparten un lazo eterno. 🌸`),
      mentions: todos,
    });
  }
};
