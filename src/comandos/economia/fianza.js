// src/comandos/economia/fianza.js
import User from "../../database/models/User.js";
import { aviso } from "../../utils/format.js";

export const name      = "fianza";
export const aliases   = ["libertad", "pagar"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

export const run = async (contexto) => {
  const { reply, sender, react } = contexto;

  const user = await User.findOne({ jid: sender });
  if (!user) return;

  if (!user.isJailed) {
    return reply(aviso("No estás en la cárcel. ¡Disfruta de tu libertad! 🕊️"));
  }

  // La fianza es el 10% del dinero total (cartera + banco) con un mínimo de 1000
  const totalDinero = (user.money || 0) + (user.bank || 0);
  const montoFianza = Math.max(1000, Math.floor(totalDinero * 0.10));

  if (totalDinero < montoFianza) {
    return reply(aviso(`No tienes suficiente dinero para pagar la fianza de *${montoFianza}* monedas. 💸\n       𝄄   _Tendrás que cumplir tu condena._`));
  }

  // Cobrar de la cartera primero, luego del banco
  if (user.money >= montoFianza) {
    user.money -= montoFianza;
  } else {
    const resto = montoFianza - user.money;
    user.money = 0;
    user.bank -= resto;
  }

  user.isJailed = false;
  user.jailUntil = null;
  await user.save();
  await react("🕊️");

  return reply(aviso(`🕊️ *LIBERTAD BAJO FIANZA*\n\nHas pagado una fianza de *${montoFianza}* monedas y has sido liberado inmediatamente.\n       𝄄   _¡No vuelvas a meterte en problemas!_`));
};
