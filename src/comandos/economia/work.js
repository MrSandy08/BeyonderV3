// src/comandos/economia/work.js
import User from "../../database/models/User.js";
import { aviso } from "../../utils/format.js";

export const name      = "work";
export const aliases   = ["w", "trabajar"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

const MS_EN_HORA = 60 * 60 * 1000;
const MS_EN_MIN  = 60 * 1000;

export const run = async (contexto) => {
  const { reply, sender, from } = contexto;

  const user = await User.findOne({ jid: sender, groupId: from });
  if (!user) return;

  const ahora = new Date();
  if (user.cooldowns?.work && user.cooldowns.work > ahora) {
    const restante = user.cooldowns.work - ahora;
    const min = Math.floor(restante / MS_EN_MIN);
    const seg = Math.floor((restante % MS_EN_MIN) / 1000);
    return reply(aviso(`Estás agotado para trabajar. Descansa un poco.\n       𝄄   _Tiempo restante: ${min}m ${seg}s_`));
  }

  const exito = Math.random() > 0.15; // 85% éxito
  if (exito) {
    const ganancia = Math.floor(Math.random() * (500 - 100 + 1)) + 100;
    user.money += ganancia;
    user.cooldowns.work = new Date(ahora.getTime() + 10 * MS_EN_MIN); // 10 min cooldown normal
    await user.save();
    return reply(aviso(`💼 *TRABAJO EXITOSO*\n\nHas trabajado duro hoy y ganaste *${ganancia}* monedas.\n       𝄄   _Tu nuevo saldo: ${user.money}_`));
  } else {
    // 15% fallo: Despedido por 2 horas
    user.cooldowns.work = new Date(ahora.getTime() + 2 * MS_EN_HORA);
    await user.save();
    return reply(aviso(`⚠️ *TRABAJO FALLIDO*\n\n¡Cometiste un error grave en el trabajo y te han despedido!\n       𝄄   _No puedes trabajar por las próximas 2 horas._`));
  }
};
