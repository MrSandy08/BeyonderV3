// src/comandos/economia/cazar.js
import User from "../../database/models/User.js";
import { aviso } from "../../utils/format.js";

export const name      = "cazar";
export const aliases   = ["hunt", "caza"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

const MS_EN_MIN = 60 * 1000;

export const run = async (contexto) => {
  const { reply, sender, communityId } = contexto;

  const user = await User.findOne({ jid: sender, communityId });
  if (!user) return;

  const ahora = new Date();
  if (user.cooldowns?.cazar && user.cooldowns.cazar > ahora) {
    const restante = user.cooldowns.cazar - ahora;
    const min = Math.floor(restante / MS_EN_MIN);
    const seg = Math.floor((restante % MS_EN_MIN) / 1000);
    return reply(aviso(`Estás agotado de la cacería. Descansa un poco.\n       𝄄   _Tiempo restante: ${min}m ${seg}s_`));
  }

  const suerte = Math.random();
  let ganancia = 0;
  let animal = "";
  let rareza = "";

  if (suerte < 0.10) { // 10% Legendario
    ganancia = Math.floor(Math.random() * (3000 - 2000 + 1)) + 2000;
    animal = "Oso de la Cueva 🐻❄️";
    rareza = "LEGENDARIO";
  } else if (suerte < 0.25) { // 15% Raro
    ganancia = Math.floor(Math.random() * (1200 - 800 + 1)) + 800;
    animal = "Lobo Alfa 🐺🌙";
    rareza = "RARO";
  } else if (suerte < 0.55) { // 30% Común
    ganancia = Math.floor(Math.random() * (600 - 400 + 1)) + 400;
    animal = "Ciervo 🦌🌲";
    rareza = "COMÚN";
  } else if (suerte < 0.85) { // 30% Poco valor
    ganancia = Math.floor(Math.random() * (300 - 150 + 1)) + 150;
    animal = "Conejo 🐇🍀";
    rareza = "BÁSICO";
  } else { // 15% Daño/Ataque
    const multa = Math.floor(Math.random() * (500 - 300 + 1)) + 300;
    user.money = Math.max(0, user.money - multa);
    user.cooldowns.cazar = new Date(ahora.getTime() + 5 * MS_EN_MIN); // 5 min cooldown por daño
    await user.save();
    return reply(aviso(`🏹 *CAZA: ATAQUE!*\n\n¡Un jabalí te atacó por sorpresa! 🐗💨\n       𝄄   _Perdiste: ${multa} monedas en curaciones_\n       𝄄   _Tu nuevo saldo: ${user.money}_`));
  }

  user.money += ganancia;
  user.cooldowns.cazar = new Date(ahora.getTime() + 3 * MS_EN_MIN); // 3 min cooldown
  await user.save();

  return reply(aviso(`🏹 *CAZA: ${rareza}*\n\n¡Has cazado un *${animal}*!\n       𝄄   _Ganaste: ${ganancia} monedas_\n       𝄄   _Tu nuevo saldo: ${user.money}_`));
};
