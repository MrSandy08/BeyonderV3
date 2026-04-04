// src/comandos/economia/recolectar.js
import User from "../../database/models/User.js";
import { aviso } from "../../utils/format.js";

export const name      = "recolectar";
export const aliases   = ["impuestos", "recolecta"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

const MS_EN_MIN = 60 * 1000;

export const run = async (contexto) => {
  const { reply, sender, from, isMod, isOwner, isWAAdmin } = contexto;

  const user = await User.findOne({ jid: sender });
  if (!user) return;

  // Solo Líderes (Mod/Owner/Admin)
  if (!isMod && !isOwner && !isWAAdmin) {
    return reply(aviso("Solo los *Líderes* del grupo pueden cobrar impuestos. 🏛️"));
  }

  const ahora = new Date();
  if (user.cooldowns?.recolectar && user.cooldowns.recolectar > ahora) {
    const restante = user.cooldowns.recolectar - ahora;
    const min = Math.floor(restante / MS_EN_MIN);
    const seg = Math.floor((restante % MS_EN_MIN) / 1000);
    return reply(aviso(`Acabas de recolectar impuestos recientemente.\n       𝄄   _Tiempo restante: ${min}m ${seg}s_`));
  }

  // Cobrar a los que NO tienen personaje
  const sinP = await User.find({ groupId: from, personaje: null, money: { $gte: 10 } });
  if (!sinP.length) return reply(aviso("No hay usuarios sin personaje en este grupo que tengan dinero para cobrar. 💸"));

  let botinTotal = 0;
  const impuesto = 10; // Impuesto fijo de 10 monedas por usuario sin personaje

  for (const victim of sinP) {
    victim.money -= impuesto;
    botinTotal += impuesto;
    await victim.save();
  }

  user.money += botinTotal;
  user.cooldowns.recolectar = new Date(ahora.getTime() + 3 * MS_EN_MIN); // 3 min cooldown
  await user.save();

  return reply(aviso(`🏛️ *RECOLECCIÓN DE IMPUESTOS*\n\n¡Has recolectado un total de *${botinTotal}* monedas de ${sinP.length} usuarios sin personaje!\n       𝄄   _Tu nuevo saldo: ${user.money}_`));
};
