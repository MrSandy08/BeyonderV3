// src/comandos/economia/ricos.js
import User from "../../database/models/User.js";
import { aviso } from "../../utils/format.js";

export const name      = "ricos";
export const aliases   = ["topricos", "millonarios", "topmoney"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

const numFromJid = (jid) => jid?.split("@")[0] || jid;

export const run = async (contexto) => {
  const { reply } = contexto;

  // Agregación de MongoDB para unificar por JID (en caso de que haya duplicados históricos)
  // y sumar Cartera + Banco
  const top10 = await User.aggregate([
    {
      $group: {
        _id: "$jid",
        totalCartera: { $sum: { $ifNull: ["$money", 0] } },
        totalBanco:   { $sum: { $ifNull: ["$bank", 0] } },
        nombre:       { $first: { $ifNull: ["$personaje", { $ifNull: ["$nombre", "Usuario"] }] } }
      }
    },
    {
      $addFields: {
        totalGlobal: { $add: ["$totalCartera", "$totalBanco"] }
      }
    },
    { $match: { totalGlobal: { $gt: 0 } } },
    { $sort: { totalGlobal: -1 } },
    { $limit: 10 }
  ]);

  if (!top10.length) {
    return reply(aviso("No hay usuarios con dinero registrado todavía. 💸"));
  }

  let txt = `🏆 *TOP 10 USUARIOS MÁS RICOS (GLOBAL)* 🏆\n\n`;

  top10.forEach((u, i) => {
    const medalla = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "👤";
    txt += `${medalla} *${i + 1}. ${u.nombre}*\n`;
    txt += `   𝄄   Total: *$${u.totalGlobal.toLocaleString()}*\n`;
    txt += `   𝄄   Cartera: $${u.totalCartera.toLocaleString()} | Banco: $${u.totalBanco.toLocaleString()}\n`;
    txt += `   𝄄   ID: @${numFromJid(u._id)}\n\n`;
  });

  txt += `       𝄄   _¡Sigue trabajando para entrar al top!_`;

  return reply(txt, top10.map(u => u._id));
};
