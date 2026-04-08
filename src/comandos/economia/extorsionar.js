// src/comandos/economia/extorsionar.js
import User from "../../database/models/User.js";
import { aviso } from "../../utils/format.js";
import userTarget from "../../utils/userTarget.js";

export const name      = "extorsionar";
export const aliases   = ["extorsión", "extort"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

const MS_EN_MIN = 60 * 1000;

const numFromJid = (jid) => jid?.split("@")[0] || jid;

export const run = async (contexto) => {
  const { reply, sender, react, communityId } = contexto;

  const user = await User.findOne({ jid: sender, communityId });
  if (!user) return;

  const ahora = new Date();
  if (user.cooldowns?.extorsionar && user.cooldowns.extorsionar > ahora) {
    const restante = user.cooldowns.extorsionar - ahora;
    const min = Math.floor(restante / MS_EN_MIN);
    const seg = Math.floor((restante % MS_EN_MIN) / 1000);
    return reply(aviso(`Estás ocultándote de la policía. Espera un poco.\n       𝄄   _Tiempo restante: ${min}m ${seg}s_`));
  }

  const targetJid = await userTarget(contexto, User);
  if (!targetJid || targetJid === sender) {
    return reply(aviso("Menciona a alguien para extorsionar. 🔫"));
  }

  const victim = await User.findOne({ jid: targetJid, communityId });
  if (!victim || victim.money < 50) {
    return reply(aviso("Esa persona no tiene suficiente dinero para valer la pena el riesgo. 💸"));
  }

  const suerte = Math.random();
  const exito = suerte < 0.65; // 65% éxito

  if (exito) {
    const porcentaje = Math.floor(Math.random() * (8 - 4 + 1)) + 4;
    const botin = Math.floor(victim.money * (porcentaje / 100));
    
    user.money += botin;
    victim.money -= botin;
    user.cooldowns.extorsionar = new Date(ahora.getTime() + 2 * MS_EN_MIN);
    
    await user.save();
    await victim.save();
    await react("💸");
    
    return reply(aviso(`🔫 *EXTORSIÓN EXITOSA*\n\n¡Has robado *${botin}* monedas (un ${porcentaje}%) a @${numFromJid(targetJid)}! 💰💨`), [targetJid]);
  } else {
    // Fallo: Cárcel por 15 min y multa
    const fianza = Math.floor(Math.random() * (200 - 100 + 1)) + 100;
    user.money = Math.max(0, user.money - fianza);
    user.isJailed = true;
    user.jailUntil = new Date(ahora.getTime() + 15 * MS_EN_MIN); // 15 min cárcel
    user.cooldowns.extorsionar = new Date(ahora.getTime() + 5 * MS_EN_MIN);
    
    await user.save();
    await react("🚔");
    
    return reply(aviso(`🚔 *EXTORSIÓN FALLIDA*\n\n¡La policía te atrapó intentando extorsionar a @${numFromJid(targetJid)}! ⛓️🚔\n       𝄄   _Pagaste una fianza de: ${fianza} monedas_\n       𝄄   _Condena: 15 minutos en la cárcel_`), [targetJid]);
  }
};
