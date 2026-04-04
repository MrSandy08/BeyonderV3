// src/comandos/mod/antifiltro.js
import Config from "../../database/models/Config.js";
import { aviso } from "../../utils/format.js";

export const name      = "antifiltro";
export const aliases   = ["antinsfw", "antigore", "filtro", "filtros"];
export const onlyAdmin = false;
export const onlyMod   = true;
export const onlyOwner = false;

export const run = async (contexto) => {
  const { reply, react, from, args, cfg, isOwner, msg } = contexto;

  const rawBody = (
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text || ""
  ).trim().toLowerCase();

  const isNsfwCmd = rawBody.startsWith("!antinsfw") || args[0] === "nsfw";
  const isGoreCmd = rawBody.startsWith("!antigore") || args[0] === "gore";

  // Verificar si está bloqueado por Owner
  if (isNsfwCmd && cfg?.lockAntinsfw && !isOwner) {
    return reply(aviso("❌ La configuración de *AntiNSFW* está bloqueada por un Owner."));
  }
  if (isGoreCmd && cfg?.lockAntigore && !isOwner) {
    return reply(aviso("❌ La configuración de *AntiGore* está bloqueada por un Owner."));
  }

  const sub = args[0]?.toLowerCase() === "on" || args[0]?.toLowerCase() === "off" 
    ? args[0].toLowerCase() 
    : args[1]?.toLowerCase();

  if (sub !== "on" && sub !== "off") {
    return reply(aviso("Uso:\n_!antinsfw on/off_\n_!antigore on/off_"));
  }

  const activo = sub === "on";
  let update = {};
  let label = "";

  if (isNsfwCmd) {
    update = { antinsfw: activo };
    label = "AntiNSFW (IA)";
  } else if (isGoreCmd) {
    update = { antigore: activo };
    label = "AntiGore (CLIP)";
  } else {
    // Si usa !antifiltro on/off directamente, activamos ambos por defecto o pedimos especificar
    return reply(aviso("Por favor, especifica el filtro:\n_!antinsfw on/off_ o _!antigore on/off_"));
  }

  await Config.findOneAndUpdate({ groupId: from }, { $set: update }, { upsert: true });
  await react(activo ? "✅" : "🔓");
  await reply(aviso(`*${label}* ${activo ? "activado" : "desactivado"}.`));
};
