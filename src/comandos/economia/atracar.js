// src/comandos/economia/atracar.js
import User from "../../database/models/User.js";
import { aviso } from "../../utils/format.js";
import userTarget from "../../utils/userTarget.js";

export const name      = "atracar";
export const aliases   = ["rob", "robar", "asalto"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

const MS_EN_MIN = 60 * 1000;

const numFromJid = (jid) => jid?.split("@")[0] || jid;

export const run = async (contexto) => {
  const { reply, sender, react } = contexto;

  const user = await User.findOne({ jid: sender });
  if (!user) return;

  const ahora = new Date();
  if (user.cooldowns?.atracar && user.cooldowns.atracar > ahora) {
    const restante = user.cooldowns.atracar - ahora;
    const min = Math.floor(restante / MS_EN_MIN);
    const seg = Math.floor((restante % MS_EN_MIN) / 1000);
    return reply(aviso(`Estás ocultándote de la policía. Espera un poco.\n       𝄄   _Tiempo restante: ${min}m ${seg}s_`));
  }

  const targetJid = await userTarget(contexto, User);
  if (!targetJid || targetJid === sender) {
    return reply(aviso("Menciona a alguien para atracar. 🔫"));
  }

  const victim = await User.findOne({ jid: targetJid });
  if (!victim || victim.money < 100) {
    return reply(aviso("Esa persona no tiene suficiente dinero para valer la pena el riesgo. 💸"));
  }

  const suerte = Math.random();
  const exito = suerte < 0.45; // 45% éxito

  if (exito) {
    const porcentaje = Math.floor(Math.random() * (20 - 10 + 1)) + 10;
    const botin = Math.floor(victim.money * (porcentaje / 100));
    
    user.money += botin;
    victim.money -= botin;
    user.cooldowns.atracar = new Date(ahora.getTime() + 3 * MS_EN_MIN);
    
    await user.save();
    await victim.save();
    await react("🔫");
    
    return reply(aviso(`🔫 *ATRACO EXITOSO*\n\n¡Has robado *${botin}* monedas (un ${porcentaje}%) a @${numFromJid(targetJid)}! 💰💨`), [targetJid]);
  } else {
    // Fallo: Cárcel por 1 hora y multa
    const fianza = Math.floor(Math.random() * (500 - 200 + 1)) + 200;
    user.money = Math.max(0, user.money - fianza);
    user.isJailed = true;
    user.jailUntil = new Date(ahora.getTime() + 60 * MS_EN_MIN); // 1 hora cárcel
    user.cooldowns.atracar = new Date(ahora.getTime() + 10 * MS_EN_MIN);
    
    await user.save();
    await react("🚔");
    
    return reply(aviso(`🚔 *ATRACO FALLIDO*\n\n¡La policía te atrapó intentando robar a @${numFromJid(targetJid)}! ⛓️🚔\n       𝄄   _Pagaste una fianza de: ${fianza} monedas_\n       𝄄   _Condena: 1 hora en la cárcel_`), [targetJid]);
  }
};
