// src/comandos/owner/beyonder.js
import Config from "../../database/models/Config.js";
import { aviso } from "../../utils/format.js";

export const name      = "beyonder";
export const aliases   = [];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = true;

export const run = async (contexto) => {
  const { reply, react, from, args } = contexto;

  const sub = args[0]?.toLowerCase();
  if (sub !== "on" && sub !== "off") return reply(aviso("Uso: _!beyonder on_ o _!beyonder off_"));

  const activo = sub === "on";
  await Config.findOneAndUpdate({ groupId: from }, { $set: { botActivo: activo } }, { upsert: true });
  await react(activo ? "✅" : "💤");
  await reply(
    activo
      ? aviso("*Beyonder activado.* ✅\n       𝄄   _Estoy de vuelta._")
      : aviso("*Beyonder en silencio.* 💤\n       𝄄   _Solo los Owners pueden activarme._")
  );
};
