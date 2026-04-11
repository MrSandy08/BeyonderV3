// src/comandos/economia/work.js
import UserClass from "../../classes/User.js";
import EconomyClass from "../../classes/Economy.js";
import { aviso } from "../../utils/format.js";

export const name      = "work";
export const aliases   = ["w", "trabajar"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

const DURACION_TRABAJO = 2 * 60 * 1000; // 2 min
const DURACION_DESPIDO = 10 * 60 * 1000; // 10 min

export const run = async (contexto) => {
  const { reply, sender, communityId } = contexto;

  const u = await UserClass.get(sender, communityId);
  if (!u) return;

  if (u.isCooldownActive("work")) {
    const { min, seg } = u.getCooldownTimeLeft("work");
    return reply(aviso(`Estás agotado para trabajar. Descansa un poco.\n       𝄄   _Tiempo restante: ${min}m ${seg}s_`));
  }

  const exito = Math.random() > 0.05; // 95% éxito
  if (exito) {
    const ganancia = EconomyClass.generateReward(100, 500);
    await u.addMoney(ganancia);
    await u.setCooldown("work", DURACION_TRABAJO);
    
    return reply(aviso(`💼 *TRABAJO EXITOSO*\n\nHas trabajado duro hoy y ganaste *${ganancia}* monedas.\n       𝄄   _Tu nuevo saldo: ${u.data.money}_`));
  } else {
    // 5% fallo: Despedido
    await u.setCooldown("work", DURACION_DESPIDO);
    return reply(aviso(`⚠️ *TRABAJO FALLIDO*\n\n¡Cometiste un error grave en el trabajo y te han despedido!\n       𝄄   _No puedes trabajar por los próximos 10 minutos._`));
  }
};
