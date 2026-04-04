// src/comandos/economia/robar.js
import User from "../../database/models/User.js";
import { aviso } from "../../utils/format.js";
import userTarget from "../../utils/userTarget.js";

export const name      = "robar";
export const aliases   = ["steal"];
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
  if (user.cooldowns?.robar && user.cooldowns.robar > ahora) {
    const restante = user.cooldowns.robar - ahora;
    const seg = Math.floor(restante / 1000);
    return reply(aviso(`Estás esperando el momento oportuno. Espera *${seg}s*.`));
  }

  const targetJid = await userTarget(contexto, User);
  if (!targetJid || targetJid === sender) {
    return reply(aviso("Menciona a alguien para robarle. 🤫"));
  }

  const victim = await User.findOne({ jid: targetJid });
  if (!victim || victim.money < 50) {
    return reply(aviso("Esa persona no tiene nada que valga la pena robar. 💸"));
  }

  const suerte = Math.random();
  const exito = suerte < 0.60; // 60% éxito

  if (exito) {
    // Roba entre el 1% y el 5% de la cartera
    const porcentaje = Math.floor(Math.random() * (5 - 1 + 1)) + 1;
    const botin = Math.floor(victim.money * (porcentaje / 100)) || 10;
    
    user.money += botin;
    victim.money -= botin;
    user.cooldowns.robar = new Date(ahora.getTime() + 1 * MS_EN_MIN);
    
    await user.save();
    await victim.save();
    await react("💸");
    
    return reply(aviso(`🤫 *ROBO DISCRETO*\n\n¡Le has quitado *${botin.toLocaleString()}* monedas de la cartera a @${numFromJid(targetJid)} sin que se dé cuenta!`), [targetJid]);
  } else {
    // Fallo: Sin cárcel, solo cooldown y pequeña pérdida
    const perdida = Math.floor(Math.random() * (50 - 20 + 1)) + 20;
    user.money = Math.max(0, user.money - perdida);
    user.cooldowns.robar = new Date(ahora.getTime() + 2 * MS_EN_MIN);
    
    await user.save();
    await react("😟");
    
    return reply(aviso(`🤫 *ROBO FALLIDO*\n\nCasi te atrapan robando a @${numFromJid(targetJid)}. Saliste corriendo pero se te cayeron *${perdida}* monedas.`), [targetJid]);
  }
};
