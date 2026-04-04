// src/comandos/economia/suerte.js
import User from "../../database/models/User.js";
import { aviso } from "../../utils/format.js";

export const name      = "suerte";
export const aliases   = ["apostar", "casino", "luck"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

const MS_EN_MIN = 60 * 1000;

export const run = async (contexto) => {
  const { reply, sender, args, react } = contexto;

  const user = await User.findOne({ jid: sender });
  if (!user) return;

  const ahora = new Date();
  if (user.cooldowns?.suerte && user.cooldowns.suerte > ahora) {
    const restante = user.cooldowns.suerte - ahora;
    const seg = Math.floor(restante / 1000);
    return reply(aviso(`Estás esperando a que la ruleta se detenga. Espera un poco.\n       𝄄   _Tiempo restante: ${seg}s_`));
  }

  const apuesta = parseInt(args[0]);
  if (!apuesta || isNaN(apuesta) || apuesta <= 0) {
    return reply(aviso("Escribe una cantidad válida para apostar.\n       𝄄   _Ej: !suerte 100_"));
  }

  if (user.money < apuesta) {
    return reply(aviso(`No tienes suficiente dinero en tu cartera para apostar *${apuesta}* monedas. 💸`));
  }

  const suerte = Math.random();
  const exito = suerte < 0.48; // 48% éxito (casi 50/50 como un casino real)

  if (exito) {
    const ganancia = Math.floor(apuesta * 1.5); // Gana 1.5 veces su apuesta
    user.money += ganancia;
    user.cooldowns.suerte = new Date(ahora.getTime() + 1 * MS_EN_MIN); // 1 min cooldown
    await user.save();
    await react("🎰");
    return reply(aviso(`🎰 *CASINO: ¡GANASTE!* 🎰\n\n¡La suerte estuvo de tu lado! Apostaste *${apuesta}* y ganaste *${ganancia}* monedas.\n       𝄄   _Tu nuevo saldo: ${user.money}_`));
  } else {
    user.money -= apuesta;
    user.cooldowns.suerte = new Date(ahora.getTime() + 1 * MS_EN_MIN); // 1 min cooldown
    await user.save();
    await react("💸");
    return reply(aviso(`🎰 *CASINO: PERDISTE* 🎰\n\n¡La ruleta no se detuvo donde querías! Perdiste tus *${apuesta}* monedas.\n       𝄄   _Tu nuevo saldo: ${user.money}_`));
  }
};
