// src/comandos/mod/economy.js
import Config from "../../database/models/Config.js";
import { aviso } from "../../utils/format.js";

export const name      = "economy";
export const aliases   = ["economia"];
export const onlyAdmin = false;
export const onlyMod   = true;
export const onlyOwner = false;

export const run = async (contexto) => {
  const { reply, from, args, isGroup } = contexto;

  if (!isGroup) return reply(aviso("Este comando solo funciona en grupos."));

  const action = args[0]?.toLowerCase();

  if (action === "on") {
    await Config.updateOne({ groupId: from }, { $set: { economyActive: true } }, { upsert: true });
    return reply(aviso("✅ La economía ha sido *ACTIVADA* en este grupo."));
  }

  if (action === "off") {
    await Config.updateOne({ groupId: from }, { $set: { economyActive: false } }, { upsert: true });
    return reply(aviso("🚫 La economía ha sido *DESACTIVADA* en este grupo."));
  }

  return reply(aviso("Uso del comando:\n       𝄄   _!economy on_ — Activar economía\n       𝄄   _!economy off_ — Desactivar economía"));
};
