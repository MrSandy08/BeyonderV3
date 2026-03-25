// src/comandos/general/top10.js
import User from "../../database/models/User.js";
import { listSection, listItem } from "../../utils/format.js";

export const name      = "top10";
export const aliases   = ["top", "ranking"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

const numFromJid = (jid) => jid?.split("@")[0] || jid;

export const run = async (contexto) => {
  const { reply, from } = contexto;

  const users = await User.find({ groupId: from, personaje: { $ne: null } }).sort({ msgCount: -1 }).limit(10).lean();
  if (!users.length) return reply("Sin datos suficientes en este grupo todavía.");

  const medals = ["🥇", "🥈", "🥉"];
  let txt = `\u200e \u200e \u200e  \u200e \u200e ━━━━━━━━ ꒰ ᧔🏆᧓ ꒱ ━━━━━━━━\n        ⤹ ⊹ ୨୧ Top 10 Activos ⿻ ₊˚๑\n     ━━━━━━━━━━━━━━━━━━━━━━━\n`;
  txt += listSection("𝓡anking");
  users.forEach((u, i) => {
    const medal = medals[i] || `${i+1}.`;
    txt += listItem(u.personaje, `${medal} — *${u.msgCount || 0} msgs*`);
  });

  await reply(txt);
};
