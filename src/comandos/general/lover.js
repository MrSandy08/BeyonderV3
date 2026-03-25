// src/comandos/general/lover.js
import User from "../../database/models/User.js";
import { aviso, listSection, listItem } from "../../utils/format.js";

export const name      = "lover";
export const aliases   = ["mipareja", "miparejas"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

const numFromJid   = (jid) => jid?.split("@")[0] || jid;
const primerNombre = (n)   => n?.split(" ")[0] || n || "???";

export const run = async (contexto) => {
  const { reply, sender, from } = contexto;

  const usuario = await User.findOne({ jid: sender, groupId: from }).lean();
  if (!usuario?.parejas?.length)
    return reply(aviso("No tienes pareja actualmente en este grupo. 💔\n       𝄄   _¿Quizás alguien espera una propuesta tuya?_ 🌸"));

  const infoParejas = await Promise.all(usuario.parejas.map(async jid => {
    const u = await User.findOne({ jid, groupId: from }).lean();
    return { jid, nombre: u?.personaje || numFromJid(jid) };
  }));

  const tipo = infoParejas.length === 1 ? "Pareja" : infoParejas.length === 2 ? "Trieja" : `${infoParejas.length}-amores`;
  const miNombre = primerNombre(usuario.personaje || numFromJid(sender));

  let txt = `\u200e \u200e \u200e  \u200e \u200e ━━━━━━━━ ꒰ ᧔💍᧓ ꒱ ━━━━━━━━\n        ⤹ ⊹ ୨୧ ${tipo} de *${miNombre}* ⿻ ₊˚๑\n     ━━━━━━━━━━━━━━━━━━━━━━━\n`;
  txt += listSection("𝓛azos");
  infoParejas.forEach(p => { 
    txt += listItem(p.nombre); 
  });

  await reply(txt);
};
