// src/comandos/general/buscarperso.js
import User from "../../database/models/User.js";
import { aviso } from "../../utils/format.js";

export const name      = "buscarperso";
export const aliases   = ["persoinfo"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

const numFromJid       = (jid) => jid?.split("@")[0] || jid;
const normalizarNombre = (n)   => n?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim() || "";

export const run = async (contexto) => {
  const { reply, args, msg, from } = contexto;

  const rawBody = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || "").trim().toLowerCase();
  const nombre  = args.join(" ").trim();
  if (!nombre) return reply(aviso("Escribe el nombre del personaje a buscar en este grupo."));

  if (rawBody.startsWith("!persoinfo")) {
    const todos  = await User.find({ groupId: from, personaje: { $ne: null } }).lean();
    const normN  = normalizarNombre(nombre);
    const u = todos.find(x => normalizarNombre(x.personaje || "") === normN) || todos.find(x => x.personaje?.toLowerCase().includes(nombre.toLowerCase()));
    if (!u) return reply(aviso("Personaje no encontrado en este grupo."));

    return reply(
      aviso(
        `Ficha: *${u.personaje}* 🎭\n` +
        `       𝄄   👤 *${numFromJid(u.jid)}*\n` +
        `       𝄄   📩 Mensajes: *${u.msgCount || 0}*\n` +
        `       𝄄   📌 Estado: *${u.afk?.activa ? "Inactivo (AFK)" : "Activo"}*`
      )
    );
  }

  const u = await User.findOne({ groupId: from, personaje: new RegExp(nombre, "i") }).lean();
  if (!u) return reply(aviso("Nadie tiene ese personaje en este grupo."));
  return reply(aviso(`*"${u.personaje}"* → *${numFromJid(u.jid)}*`));
};
