// src/comandos/economia/pescar.js
import User from "../../database/models/User.js";
import { aviso } from "../../utils/format.js";

export const name      = "pescar";
export const aliases   = ["fish", "pesca"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

const MS_EN_MIN = 60 * 1000;

export const run = async (contexto) => {
  const { reply, sender } = contexto;

  const user = await User.findOne({ jid: sender });
  if (!user) return;

  const ahora = new Date();
  if (user.cooldowns?.pescar && user.cooldowns.pescar > ahora) {
    const restante = user.cooldowns.pescar - ahora;
    const min = Math.floor(restante / MS_EN_MIN);
    const seg = Math.floor((restante % MS_EN_MIN) / 1000);
    return reply(aviso(`Estás esperando a que los peces piquen. Descansa un poco.\n       𝄄   _Tiempo restante: ${min}m ${seg}s_`));
  }

  const suerte = Math.random();
  let ganancia = 0;
  let material = "";
  let rareza = "";

  if (suerte < 0.05) { // 5% Legendario
    ganancia = Math.floor(Math.random() * (2500 - 1500 + 1)) + 1500;
    material = "Tesoro Hundido 💰";
    rareza = "LEGENDARIO";
  } else if (suerte < 0.15) { // 10% Raro
    ganancia = Math.floor(Math.random() * (1000 - 600 + 1)) + 600;
    material = "Salmón Dorado 🍣";
    rareza = "RARO";
  } else if (suerte < 0.45) { // 30% Común
    ganancia = Math.floor(Math.random() * (500 - 300 + 1)) + 300;
    material = "Pez Común 🐟";
    rareza = "COMÚN";
  } else if (suerte < 0.70) { // 25% Poco valor
    ganancia = Math.floor(Math.random() * (200 - 100 + 1)) + 100;
    material = "Sardina 🐟";
    rareza = "BÁSICO";
  } else { // 30% Pérdida
    ganancia = -20;
    material = "Bota Vieja 👢";
    rareza = "BASURA";
  }

  user.money = Math.max(0, user.money + ganancia);
  user.cooldowns.pescar = new Date(ahora.getTime() + 2 * MS_EN_MIN); // 2 min cooldown
  await user.save();

  if (ganancia < 0) {
    return reply(aviso(`🎣 *PESCA: ${rareza}*\n\n¡Qué mala suerte! Sacaste una *${material}*.\n       𝄄   _Perdiste: ${Math.abs(ganancia)} monedas por la limpieza_\n       𝄄   _Tu nuevo saldo: ${user.money}_`));
  } else {
    return reply(aviso(`🎣 *PESCA: ${rareza}*\n\n¡Has pescado un *${material}*!\n       𝄄   _Ganaste: ${ganancia} monedas_\n       𝄄   _Tu nuevo saldo: ${user.money}_`));
  }
};
