// src/comandos/general/ping.js
import { aviso } from "../../utils/format.js";

export const name      = "ping";
export const aliases   = ["status"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

export const run = async (contexto) => {
  const { reply } = contexto;
  const inicio  = Date.now();
  const uptime  = process.uptime();
  const h = Math.floor(uptime / 3600), m = Math.floor((uptime % 3600) / 60), s = Math.floor(uptime % 60);
  await reply(
    aviso(
      `Beyonder está activo. ⚡\n` +
      `       𝄄   🏓 Ping: *${Date.now() - inicio}ms*\n` +
      `       𝄄   🕐 Uptime: *${h}h ${m}m ${s}s*\n` +
      `       𝄄   🟢 Estado: *Operativo*`
    )
  );
};
