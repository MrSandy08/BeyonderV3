// src/comandos/eco/mine.js
import User from "../../database/models/User.js";

export const name      = "mine";
export const aliases   = ["minar"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

const COOLDOWN = 5 * 60 * 1000; // 5 minutos

const WEIGHTS = [
  { item: "stone",         weight: 6000 },
  { item: "coal",          weight: 2000 },
  { item: "copper",        weight: 1200 },
  { item: "iron",          weight: 600  },
  { item: "ruby_sapphire", weight: 198  },
  { item: "diamond",       weight: 2    },
];

export const run = async (contexto) => {
  const { reply, sender, from } = contexto;

  const user = await User.findOne({ jid: sender, groupId: from }).select("lastMine").lean();
  const now  = Date.now();

  if (user && user.lastMine && (now - user.lastMine) < COOLDOWN) {
    const remaining = Math.ceil((COOLDOWN - (now - user.lastMine)) / 1000);
    return reply(`⏳ Debes esperar ${remaining} segundos para volver a minar.`);
  }

  // Sistema de pesos (1 a 10,000)
  const random = Math.floor(Math.random() * 10000) + 1;
  let accumulated = 0;
  let obtained = "stone";

  for (const w of WEIGHTS) {
    accumulated += w.weight;
    if (random <= accumulated) {
      obtained = w.item;
      break;
    }
  }

  // Actualización atómica
  await User.findOneAndUpdate(
    { jid: sender, groupId: from },
    { 
      $inc: { [`inventory.minerals.${obtained}`]: 1 },
      $set: { lastMine: now }
    },
    { upsert: true }
  );

  const emoji = {
    stone: "🪨", coal: "⬛", copper: "🥉", iron: "🥈", ruby_sapphire: "💎", diamond: "✨"
  }[obtained];

  await reply(`⛏️ Has minado: *${obtained.replace("_", " ")}* ${emoji}`);
};
