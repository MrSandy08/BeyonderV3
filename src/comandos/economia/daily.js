// src/comandos/economia/daily.js
import User from "../../database/models/User.js";
import { aviso } from "../../utils/format.js";

export const name      = "daily";
export const aliases   = ["diario"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

const MS_EN_DIA = 24 * 60 * 60 * 1000;

export const run = async (contexto) => {
  const { reply, sender } = contexto;

  const user = await User.findOne({ jid: sender });
  if (!user) return;

  const ahora = new Date();
  const ultimaVez = user.lastDaily || new Date(0);
  const diff = ahora - ultimaVez;

  // Si ya lo reclamó hoy
  if (user.cooldowns?.daily && user.cooldowns.daily > ahora) {
    const restante = user.cooldowns.daily - ahora;
    const horas = Math.floor(restante / (60 * 60 * 1000));
    const min = Math.floor((restante % (60 * 60 * 1000)) / (60 * 1000));
    return reply(aviso(`Aún no puedes reclamar tu bono diario.\n       𝄄   _Tiempo restante: ${horas}h ${min}m_`));
  }

  // Lógica de racha (streak)
  // Si pasaron menos de 48h, mantiene la racha
  if (diff < 2 * MS_EN_DIA) {
    user.dailyStreak = (user.dailyStreak || 0) + 1;
  } else {
    user.dailyStreak = 1;
  }

  let ganancia = 2000;
  let msgStreak = "";

  // Si llegó a 7 días, premio doble
  if (user.dailyStreak >= 7) {
    ganancia *= 2;
    user.dailyStreak = 0; // Reset racha tras el premio gordo
    msgStreak = "\n🔥 ¡Racha de 7 días completada! Recompensa doble.";
  } else {
    msgStreak = `\n📅 Racha actual: *${user.dailyStreak}* días.`;
  }

  user.money += ganancia;
  user.lastDaily = ahora;
  user.cooldowns.daily = new Date(ahora.getTime() + MS_EN_DIA);
  await user.save();

  return reply(aviso(`🎁 *BONO DIARIO*\n\n¡Has reclamado tu bono de *${ganancia}* monedas!${msgStreak}\n       𝄄   _Tu nuevo saldo: ${user.money}_`));
};
