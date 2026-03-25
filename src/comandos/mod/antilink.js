// src/comandos/mod/antilink.js
import Config from "../../database/models/Config.js";
import { aviso } from "../../utils/format.js";

export const name      = "antilink";
export const aliases   = [];
export const onlyAdmin = false;
export const onlyMod   = true;
export const onlyOwner = false;

export const run = async (contexto) => {
  const { reply, react, from, args, cfg, isOwner } = contexto;

  if (cfg?.lockAntilink && !isOwner)
    return reply(aviso("🔒 El antilink está bloqueado. Solo el Owner puede modificarlo."));

  const sub = args[0]?.toLowerCase();
  if (sub !== "on" && sub !== "off") return reply(aviso("Uso: _!antilink on_ o _!antilink off_"));

  const activo = sub === "on";
  await Config.findOneAndUpdate({ groupId: from }, { $set: { antilink: activo } }, { upsert: true });
  await react(activo ? "🔗" : "✅");
  await reply(
    activo
      ? aviso("*AntiLink activado.* 🔗\n       𝄄   _Se eliminarán links externos. Los links de esta comunidad están permitidos._")
      : aviso("*AntiLink desactivado.* 🔓")
  );
};
