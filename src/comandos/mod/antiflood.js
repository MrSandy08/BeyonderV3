// src/comandos/mod/antiflood.js
import Config from "../../database/models/Config.js";
import { aviso } from "../../utils/format.js";

export const name      = "antiflood";
export const aliases   = [];
export const onlyAdmin = false;
export const onlyMod   = true;
export const onlyOwner = false;

export const run = async (contexto) => {
  const { reply, react, from, args, cfg, isOwner } = contexto;

  if (cfg?.lockAntiflood && !isOwner)
    return reply(aviso("🔒 El antiflood está bloqueado. Solo el Owner puede modificarlo."));

  const sub = args[0]?.toLowerCase();
  if (sub !== "on" && sub !== "off") return reply(aviso("Uso: _!antiflood on_ o _!antiflood off_"));

  const activo = sub === "on";
  await Config.findOneAndUpdate({ groupId: from }, { $set: { antiflood: activo } }, { upsert: true });
  await react(activo ? "🌊" : "✅");
  await reply(
    activo
      ? aviso("*AntiFlood activado.* 🌊\n       𝄄   _Si alguien envía +15 mensajes en 5 seg, el grupo se cerrará 30 segundos._")
      : aviso("*AntiFlood desactivado.* 🔓")
  );
};
