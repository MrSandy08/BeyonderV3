// src/comandos/owner/lock.js
import Config from "../../database/models/Config.js";
import { aviso } from "../../utils/format.js";

export const name      = "lock";
export const aliases   = ["unlock"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = true;

const TARGETS = { 
  rp:        "lockRp", 
  antilink:  "lockAntilink", 
  antiporn:  "lockAntiporn", 
  antinsfw:  "lockAntinsfw", 
  antigore:  "lockAntigore", 
  antiflood: "lockAntiflood" 
};

export const run = async (contexto) => {
  const { reply, react, from, args, msg, cfg } = contexto;

  const rawBody = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || "").trim().toLowerCase();
  const esUnlock = rawBody.startsWith("!unlock");
  const objetivo = args[0]?.toLowerCase();

  if (!objetivo || (!TARGETS[objetivo] && objetivo !== "all"))
    return reply(aviso("Uso: _!lock [rp | antilink | antiporn | antinsfw | antigore | antiflood | all]_\n       𝄄   Para desbloquear: _!unlock [...]_"));

  let update = {};
  let msgExito = "";

  if (objetivo === "all") {
    Object.values(TARGETS).forEach(campo => update[campo] = !esUnlock);
    msgExito = `*Todas las configuraciones* ${esUnlock ? "desbloqueadas 🔓" : "bloqueadas 🔒"}.`;
  } else {
    const campo = TARGETS[objetivo];
    const nuevoVal = !esUnlock;
    update[campo] = nuevoVal;
    msgExito = `*${objetivo}* ${nuevoVal ? "bloqueado 🔒" : "desbloqueado 🔓"}.`;
  }

  await Config.findOneAndUpdate({ groupId: from }, { $set: update }, { upsert: true });
  await react(!esUnlock ? "🔒" : "🔓");
  await reply(aviso(`${msgExito}\n       𝄄   _Los Mods no pueden modificar estas opciones._`));
};
