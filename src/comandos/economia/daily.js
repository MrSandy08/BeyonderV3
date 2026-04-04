// src/comandos/economia/daily.js
import User from "../../database/models/User.js";
import { aviso } from "../../utils/format.js";

export const name      = "daily";
export const aliases   = ["diario"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

const MS_EN_DIA = 24 * 60 * 60 * 1000;
const MS_EN_HORA = 60 * 60 * 1000;
const MS_EN_MIN  = 60 * 1000;

export const run = async (contexto) => {
  const { reply, sender, from } = contexto;

  const user = await User.findOne({ jid: sender, groupId: from });
  if (!user) return;

  const ahora = new Date();
  if (user.cooldowns?.daily && user.cooldowns.daily > ahora) {
    const restante = user.cooldowns.daily - ahora;
    const horas = Math.floor(restante / MS_EN_HORA);
    const min = Math.floor((restante % MS_EN_HORA) / MS_EN_MIN);
    const seg = Math.floor((restante % MS_EN_MIN) / 1000);
    return reply(aviso(`Aún no puedes reclamar tu bono diario.\n       𝄄   _Tiempo restante: ${horas}h ${min}m ${seg}s_`));
  }

  const ganancia = 2000; // Bono diario fijo
  user.money += ganancia;
  user.cooldowns.daily = new Date(ahora.getTime() + MS_EN_DIA); // 24 horas cooldown
  await user.save();
  return reply(aviso(`🎁 *BONO DIARIO*\n\n¡Has reclamado tu bono diario de *${ganancia}* monedas!\n       𝄄   _Tu nuevo saldo: ${user.money}_`));
};
