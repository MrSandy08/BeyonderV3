// src/comandos/owner/ownerping.js
import { aviso } from "../../utils/format.js";

export const name      = "ownerping";
export const aliases   = ["opstatus"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = true;

export const run = async (contexto) => {
  const { reply, react } = contexto;
  await react("👑");
  const uptime = process.uptime();
  const h = Math.floor(uptime / 3600), m = Math.floor((uptime % 3600) / 60), s = Math.floor(uptime % 60);
  await reply(
    aviso(
      `*Beyonder v3 — Status*\n` +
      `       𝄄   🤖 Bot: Conectado ✅\n` +
      `       𝄄   📡 Modo: ${process.env.NODE_ENV || "development"}\n` +
      `       𝄄   🕐 Uptime: ${h}h ${m}m ${s}s`
    )
  );
};
