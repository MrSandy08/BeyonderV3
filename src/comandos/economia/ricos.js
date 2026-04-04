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

  // Obtenemos todos los usuarios que tengan dinero o banco
  const usuarios = await User.find({ $or: [{ money: { $gt: 0 } }, { bank: { $gt: 0 } }] }).lean();

  if (!usuarios.length) {
    return reply(aviso("No hay usuarios con dinero registrado todavía. 💸"));
  }

  // Calculamos el total (Cartera + Banco) y ordenamos
  const top10 = usuarios
    .map(u => ({
      jid:      u.jid,
      nombre:   u.personaje || u.nombre || "Usuario",
      total:    (u.money || 0) + (u.bank || 0),
      cartera:  u.money || 0,
      banco:    u.bank || 0
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  let txt = `🏆 *TOP 10 USUARIOS MÁS RICOS (GLOBAL)* 🏆\n\n`;

  top10.forEach((u, i) => {
    const medalla = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "👤";
    txt += `${medalla} *${i + 1}. ${u.nombre}*\n`;
    txt += `   𝄄   Total: *$${u.total.toLocaleString()}*\n`;
    txt += `   𝄄   Cartera: $${u.cartera.toLocaleString()} | Banco: $${u.banco.toLocaleString()}\n`;
    txt += `   𝄄   ID: @${numFromJid(u.jid)}\n\n`;
  });

  txt += `       𝄄   _¡Sigue trabajando para entrar al top!_`;

  return reply(txt, top10.map(u => u.jid));
};
