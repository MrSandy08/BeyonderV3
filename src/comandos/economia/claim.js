// src/comandos/economia/claim.js
import User from "../../database/models/User.js";
import { aviso } from "../../utils/format.js";

export const name      = "claim";
export const aliases   = ["regalo", "reclamar"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

// Almacenamos el regalo activo en RAM
let activeGift = null;

export const run = async (contexto) => {
  const { reply, sender, isOwner, command, args } = contexto;

  // Solo el Owner puede lanzar un regalo manualmente
  if (command === "claim" && args[0] === "lanzar" && isOwner) {
    const monto = parseInt(args[1]) || Math.floor(Math.random() * (1000 - 500 + 1)) + 500;
    activeGift = {
      monto,
      lanzadoAt: new Date()
    };
    return reply(aviso(`🎁 *¡REGALO LANZADO EN EL CHAT!*\n\n¡El primero en escribir *!reclamar* se lleva *${monto}* monedas! 🏃‍♂️💨`));
  }

  // Si alguien intenta reclamar
  if (command === "reclamar" || command === "claim") {
    if (!activeGift) {
      return reply(aviso("No hay ningún regalo activo en este momento. 🕸️"));
    }

    const user = await User.findOne({ jid: sender });
    if (!user) return;

    const botin = activeGift.monto;
    user.money += botin;
    activeGift = null; // Se consume el regalo
    await user.save();

    return reply(aviso(`🎉 *¡REGALO RECLAMADO!*\n\n@${sender.split("@")[0]} fue el más rápido y se llevó *${botin}* monedas! 💰✨`), [sender]);
  }
};

// Función para lanzar regalos aleatorios (opcional, se puede llamar desde index.js)
export const spawnRandomGift = (sock, from) => {
  const monto = Math.floor(Math.random() * (500 - 100 + 1)) + 100;
  activeGift = { monto, lanzadoAt: new Date() };
  sock.sendMessage(from, { text: aviso(`🎁 *¡UN REGALO HA APARECIDO!*\n\n¡Escribe *!reclamar* rápido para llevarte *${monto}* monedas! 🏃‍♂️💨`) });
};
