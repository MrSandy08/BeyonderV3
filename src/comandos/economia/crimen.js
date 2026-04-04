// src/comandos/economia/crimen.js
import User from "../../database/models/User.js";
import { aviso } from "../../utils/format.js";

export const name      = "crimen";
export const aliases   = ["crime", "delito", "robarbanco"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

const MS_EN_MIN = 60 * 1000;

export const run = async (contexto) => {
  const { reply, sender, react } = contexto;

  const user = await User.findOne({ jid: sender });
  if (!user) return;

  const ahora = new Date();
  if (user.cooldowns?.crimen && user.cooldowns.crimen > ahora) {
    const restante = user.cooldowns.crimen - ahora;
    const min = Math.floor(restante / MS_EN_MIN);
    const seg = Math.floor((restante % MS_EN_MIN) / 1000);
    return reply(aviso(`Estás ocultándote de la policía. Espera un poco.\n       𝄄   _Tiempo restante: ${min}m ${seg}s_`));
  }

  const suerte = Math.random();
  const exito = suerte < 0.70; // 70% éxito

  if (exito) {
    const ganancia = Math.floor(Math.random() * (2000 - 1000 + 1)) + 1000;
    user.money += ganancia;
    user.cooldowns.crimen = new Date(ahora.getTime() + 3 * MS_EN_MIN); // 3 min cooldown
    await user.save();
    await react("💰");
    return reply(aviso(`🚬 *CRIMEN EXITOSO* 🚬\n\nHas asaltado una pequeña tienda y ganaste *${ganancia}* monedas.\n       𝄄   _Tu nuevo saldo: ${user.money}_`));
  } else {
    // Fallo: Cárcel por 15 min y multa
    const fianza = Math.floor(Math.random() * (800 - 400 + 1)) + 400;
    user.money = Math.max(0, user.money - fianza);
    user.isJailed = true;
    user.jailUntil = new Date(ahora.getTime() + 15 * MS_EN_MIN); // 15 min cárcel
    user.cooldowns.crimen = new Date(ahora.getTime() + 5 * MS_EN_MIN);
    
    await user.save();
    await react("🚔");
    
    return reply(aviso(`🚔 *CRIMEN FALLIDO* 🚔\n\n¡La policía te atrapó intentando un atraco! ⛓️🚔\n       𝄄   _Pagaste una multa de: ${fianza} monedas_\n       𝄄   _Condena: 15 minutos en la cárcel_`));
  }
};
