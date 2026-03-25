// src/comandos/owner/owners.js
import User from "../../database/models/User.js";
import { aviso, listSection, listItem } from "../../utils/format.js";

export const name      = "owners";
export const aliases   = ["listowners"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = true;

const numFromJid = (jid) => jid?.split("@")[0] || jid;

export const run = async (contexto) => {
  const { reply, react } = contexto;

  // Los owners son globales, pero buscamos por el JID único
  const ids = await User.distinct("jid", { permisos: 3 });
  if (!ids.length) return reply(aviso("No hay owners registrados en el sistema."));

  let txt = `\u200e \u200e \u200e  \u200e \u200e ━━━━━━━━ ꒰ ᧔👑᧓ ꒱ ━━━━━━━━\n        ⤹ ⊹ ୨୧ Lista de Owners ⿻ ₊˚๑\n     ━━━━━━━━━━━━━━━━━━━━━━━\n`;
  txt += listSection("𝓞wners");
  ids.forEach((jid, i) => { txt += listItem(`${i + 1}. *+${numFromJid(jid)}*`) + "\n"; });
  await react("✅");
  await reply(txt);
};
