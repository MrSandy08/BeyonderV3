// src/comandos/eco/fish.js
import User from "../../database/models/User.js";

export const name      = "fish";
export const aliases   = ["pescar"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

const COOLDOWN = 5 * 60 * 1000; // 5 minutos

const WEIGHTS = [
  { item: "common",    weight: 5000 },
  { item: "puffer",    weight: 3000 },
  { item: "salmon",    weight: 1500 },
  { item: "eel",       weight: 498  },
  { item: "leviathan", weight: 1    },
  { item: "kraken",    weight: 1    },
];

export const run = async (contexto) => {
  const { reply, sender, from } = contexto;

  const user = await User.findOne({ jid: sender, groupId: from }).select("lastFish").lean();
  const now  = Date.now();

  if (user && user.lastFish && (now - user.lastFish) < COOLDOWN) {
    const remaining = Math.ceil((COOLDOWN - (now - user.lastFish)) / 1000);
    return reply(`⏳ Debes esperar ${remaining} segundos para volver a pescar.`);
  }

  // Sistema de pesos (1 a 10,000)
  const random = Math.floor(Math.random() * 10000) + 1;
  let accumulated = 0;
  let obtained = "common";

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
      $inc: { [`inventory.fish.${obtained}`]: 1 },
      $set: { lastFish: now }
    },
    { upsert: true }
  );

  const emoji = {
    common: "🐟", puffer: "🐡", salmon: "🍣", eel: "🐍", leviathan: "🌊", kraken: "🦑"
  }[obtained];

  await reply(`🎣 Has pescado: *${obtained}* ${emoji}`);
};
