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
  const grupos     = [];

  for (const u of usersConPareja) {
    if (procesadas.has(u.jid)) continue;

    // Algoritmo BFS para encontrar todos los miembros conectados (Poliamor/Grupo)
    const grupoActual = new Set();
    const cola = [u.jid];
    grupoActual.add(u.jid);
    procesadas.add(u.jid);

    let i = 0;
    while (i < cola.length) {
      const actualJid = cola[i++];
      const userActual = await User.findOne({ jid: actualJid, groupId: from }).lean();
      
      if (userActual?.parejas) {
        for (const pJid of userActual.parejas) {
          if (!grupoActual.has(pJid)) {
            grupoActual.add(pJid);
            procesadas.add(pJid);
            cola.push(pJid);
          }
        }
      }
    }

    if (grupoActual.size > 1) {
      const nombres = await Promise.all(Array.from(grupoActual).map(async jid => {
        const user = await User.findOne({ jid, groupId: from }).lean();
        return `*${primerNombre(user?.personaje || numFromJid(jid))}*`;
      }));
      
      const esPoliamor = grupoActual.size > 2;
      grupos.push({
        texto: `${esPoliamor ? "💞 Poliamor:" : "💍 Pareja:"} ${nombres.join(", ")}`,
        miembros: Array.from(grupoActual)
      });
    }
  }

  if (!grupos.length) return reply(aviso("No hay relaciones activas."));

  // Ordenar alfabéticamente por el primer nombre del grupo para que la lista sea "limpia"
  grupos.sort((a, b) => a.texto.localeCompare(b.texto));

  let txt = `\u200e \u200e \u200e  \u200e \u200e ━━━━━━━━ ꒰ ᧔💍᧓ ꒱ ━━━━━━━━\n        ⤹ ⊹ ୨୧ Relaciones del Grupo ⿻ ₊˚๑\n     ━━━━━━━━━━━━━━━━━━━━━━━\n`;
  txt += listSection("𝓛azos 𝓔ternos");
  grupos.forEach(g => { 
    txt += ` 𝄄➥ ${g.texto}\n`; 
  });

  await reply(txt);
};
