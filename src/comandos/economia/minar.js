// src/comandos/economia/minar.js
import User from "../../database/models/User.js";
import { aviso } from "../../utils/format.js";

export const name      = "minar";
export const aliases   = ["mine", "minería"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

const MS_EN_MIN = 60 * 1000;

export const run = async (contexto) => {
  const { reply, sender } = contexto;

  const user = await User.findOne({ jid: sender });
  if (!user) return;

  const ahora = new Date();
  if (user.cooldowns?.minar && user.cooldowns.minar > ahora) {
    const restante = user.cooldowns.minar - ahora;
    const min = Math.floor(restante / MS_EN_MIN);
    const seg = Math.floor((restante % MS_EN_MIN) / 1000);
    return reply(aviso(`Estás cansado de minar. Descansa un poco.\n       𝄄   _Tiempo restante: ${min}m ${seg}s_`));
  }

  const suerte = Math.random();
  let ganancia = 0;
  let material = "";
  let rareza = "";

  if (suerte < 0.05) { // 5% Legendario
    ganancia = Math.floor(Math.random() * (2000 - 1500 + 1)) + 1500;
    material = "Diamante 💎";
    rareza = "LEGENDARIO";
  } else if (suerte < 0.20) { // 15% Raro
    ganancia = Math.floor(Math.random() * (800 - 500 + 1)) + 500;
    material = "Oro 📀";
    rareza = "RARO";
  } else if (suerte < 0.50) { // 30% Común
    ganancia = Math.floor(Math.random() * (400 - 200 + 1)) + 200;
    material = "Hierro ⛓️";
    rareza = "COMÚN";
  } else { // 50% Poco valor
    ganancia = Math.floor(Math.random() * (150 - 50 + 1)) + 50;
    material = "Carbón ⬛";
    rareza = "BÁSICO";
  }

  user.money += ganancia;
  user.cooldowns.minar = new Date(ahora.getTime() + 3 * MS_EN_MIN); // 3 min cooldown
  await user.save();

  return reply(aviso(`⛏️ *MINERÍA: ${rareza}*\n\n¡Has encontrado *${material}*!\n       𝄄   _Ganaste: ${ganancia} monedas_\n       𝄄   _Tu nuevo saldo: ${user.money}_`));
};
