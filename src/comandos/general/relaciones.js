// src/comandos/general/relaciones.js
import User from "../../database/models/User.js";
import { aviso, listSection, listItem } from "../../utils/format.js";

export const name      = "relaciones";
export const aliases   = ["parejas", "couples"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

const numFromJid   = (jid) => jid?.split("@")[0] || jid;
const primerNombre = (n)   => n?.split(" ")[0] || n || "???";

export const run = async (contexto) => {
  const { reply, from } = contexto;

  const usersConPareja = await User.find({ groupId: from, "parejas.0": { $exists: true } }).lean();
  if (!usersConPareja.length) return reply(aviso("No hay relaciones registradas en este grupo todavía."));

  const procesadas = new Set();
  const bloques    = [];

  for (const u of usersConPareja) {
    for (const pJid of u.parejas) {
      const clave = [u.jid, pJid].sort().join("_");
      if (procesadas.has(clave)) continue;
      procesadas.add(clave);

      const p        = await User.findOne({ jid: pJid, groupId: from }).lean();
      const nombre1  = u.personaje || numFromJid(u.jid);
      const nombre2  = p?.personaje || numFromJid(pJid);
      const esPoliamor = u.parejas.length > 1 || (p?.parejas?.length || 0) > 1;
      bloques.push({ 
        texto: `${esPoliamor ? "💞" : "💍"} *${nombre1}* & *${nombre2}*`, 
        miembros: [u.jid, pJid] 
      });
    }
  }

  if (!bloques.length) return reply(aviso("No hay relaciones activas."));

  let txt = `\u200e \u200e \u200e  \u200e \u200e ━━━━━━━━ ꒰ ᧔💍᧓ ꒱ ━━━━━━━━\n        ⤹ ⊹ ୨୧ Relaciones del Grupo ⿻ ₊˚๑\n     ━━━━━━━━━━━━━━━━━━━━━━━\n`;
  txt += listSection("𝓡elaciones");
  bloques.forEach(b => { 
    txt += ` 𝄄➥ ${b.texto}\n`; 
  });

  await reply(txt);
};
