// src/comandos/economia/retirar.js
import User from "../../database/models/User.js";
import { aviso } from "../../utils/format.js";

export const name      = "retirar";
export const aliases   = ["withdraw", "with"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

export const run = async (contexto) => {
  const { reply, sender, args } = contexto;

  const user = await User.findOne({ jid: sender });
  if (!user) return;

  const input = args[0]?.toLowerCase();
  if (!input) return reply(aviso("Escribe la cantidad que deseas retirar o usa *all*.\n       𝄄   _Ej: !retirar 500_ | _!retirar all_"));

  let monto = 0;
  if (input === "all") {
    monto = user.bank;
  } else {
    monto = parseInt(input);
  }

  if (isNaN(monto) || monto <= 0) {
    return reply(aviso("Escribe una cantidad válida para retirar."));
  }

  if (user.bank < monto) {
    return reply(aviso(`No tienes suficiente dinero en tu banco para retirar *${monto}* monedas.`));
  }

  user.bank  -= monto;
  user.money += monto;
  await user.save();

  return reply(aviso(`🏦 *RETIRO BANCARIO*\n\nHas retirado *${monto.toLocaleString()}* monedas de tu banco.\n       𝄄   _Cartera: $${user.money.toLocaleString()}_\n       𝄄   _Banco: $${user.bank.toLocaleString()}_`));
};
