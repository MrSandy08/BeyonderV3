// src/comandos/economia/ricos.js
import User from "../../database/models/User.js";
import { aviso, header } from "../../utils/format.js";

export const name      = "ricos";
export const aliases   = ["millonarios", "topmoney", "topricos"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

const numFromJid = (jid) => jid?.split("@")[0] || jid;

export const run = async (contexto) => {
  const { reply, communityId } = contexto;

  // Agregación de MongoDB para unificar por JID en la comunidad actual
  const top10 = await User.aggregate([
    { $match: { communityId } },
    {
      $group: {
        _id: "$jid",
        totalCartera: { $sum: { $ifNull: ["$money", 0] } },
        totalBanco:   { $sum: { $ifNull: ["$bank", 0] } },
        // Lógica para elegir el mejor nombre disponible
        personaje:    { $max: { $ifNull: ["$personaje", null] } },
        nombreWA:     { $first: { $ifNull: ["$nombre", "Usuario"] } }
      }
    },
    {
      $addFields: {
        totalGlobal: { $add: ["$totalCartera", "$totalBanco"] },
        nombreFinal: { $ifNull: ["$personaje", "$nombreWA"] }
      }
    },
    { $match: { totalGlobal: { $gt: 0 } } },
    { $sort: { totalGlobal: -1 } },
    { $limit: 10 }
  ]);

  if (!top10.length) {
    return reply(aviso("No hay usuarios con dinero registrado todavía. 💸"));
  }

  let txt = header("Top 10 Millonarios") + "\n\n";

  top10.forEach((u, i) => {
    const medalla = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "👤";
    txt += ` ${medalla} *${i + 1}. ${u.nombreFinal}*\n`;
    txt += `       𝄄   Total: *$${u.totalGlobal.toLocaleString()}*\n`;
    txt += `       𝄄   Banco: $${u.totalBanco.toLocaleString()} | Cartera: $${u.totalCartera.toLocaleString()}\n`;
    txt += `       𝄄   ID: @${numFromJid(u._id)}\n\n`;
  });

  txt += `                 𑂯 ( ⚡ ) ⁺ 𓈒  ׁ     
       𝄄   _¡Sigue trabajando para entrar al top!_
       @𝐀𝗍𝗍𝖾 : ℬeyonder`;

  return reply(txt, top10.map(u => u._id));
};
