// src/comandos/economia/depositar.js
import User from "../../database/models/User.js";
import { aviso } from "../../utils/format.js";

export const name      = "depositar";
export const aliases   = ["dep", "d"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

export const run = async (contexto) => {
  const { reply, sender, args, communityId } = contexto;

  const user = await User.findOne({ jid: sender, communityId });
  if (!user) return;

  const input = args[0]?.toLowerCase();
  if (!input) return reply(aviso("Escribe la cantidad que deseas depositar o usa *all*.\n       𝄄   _Ej: !depositar 500_ | _!depositar all_"));

  let monto = 0;
  if (input === "all") {
    monto = user.money;
  } else {
    monto = parseInt(input);
  }

  if (isNaN(monto) || monto <= 0) {
    return reply(aviso("Escribe una cantidad válida para depositar."));
  }

  if (user.money < monto) {
    return reply(aviso(`No tienes suficiente dinero en tu cartera para depositar *${monto}* monedas.`));
  }

  user.money -= monto;
  user.bank  += monto;
  await user.save();

  return reply(aviso(`🏦 *DEPÓSITO BANCARIO*\n\nHas depositado *${monto.toLocaleString()}* monedas en tu banco.\n       𝄄   _Cartera: $${user.money.toLocaleString()}_\n       𝄄   _Banco: $${user.bank.toLocaleString()}_`));
};
