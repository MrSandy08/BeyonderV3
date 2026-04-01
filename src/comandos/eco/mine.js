import User from "../../database/models/User.js";
import { renderExplorationScene } from "../../services/pokemonService.js";

export const name      = "mine";
export const aliases   = ["minar"];

const COOLDOWN = 30 * 1000; // 30 segundos (Pedido por el usuario)

const WEIGHTS = [
  { item: "stone",         weight: 6000, price: 5,   name: "Piedra" },
  { item: "coal",          weight: 2000, price: 15,  name: "Carbón" },
  { item: "copper",        weight: 1200, price: 40,  name: "Cobre" },
  { item: "iron",          weight: 600,  price: 100, name: "Hierro" },
  { item: "ruby_sapphire", weight: 198,  price: 500, name: "Rubí/Zafiro" },
  { item: "diamond",       weight: 2,    price: 2500,name: "Diamante" },
];

export const run = async (contexto) => {
  const { reply, sender, from, sock, msg } = contexto;

  const user = await User.findOne({ jid: sender, groupId: from });
  const now  = Date.now();

  if (user && user.lastMine && (now - user.lastMine) < COOLDOWN) {
    const remaining = Math.ceil((COOLDOWN - (now - user.lastMine)) / 1000);
    return reply(`⏳ Espera ${remaining}s.`);
  }

  const random = Math.floor(Math.random() * 10000) + 1;
  let accumulated = 0;
  let obtainedData = WEIGHTS[0];

  for (const w of WEIGHTS) {
    accumulated += w.weight;
    if (random <= accumulated) {
      obtainedData = w;
      break;
    }
  }

  const updateQuery = { 
    $inc: { [`inventory.minerals.${obtainedData.item}`]: 1, gold: obtainedData.price },
    $set: { lastMine: now }
  };

  await User.findOneAndUpdate({ jid: sender, groupId: from }, updateQuery, { upsert: true });

  const buffer = await renderExplorationScene("mining", obtainedData.name, true);
  return await sock.sendMessage(from, { 
    image: buffer, 
    caption: `⛏️ ¡Has minado *${obtainedData.name}*! (+${obtainedData.price} Oro)` 
  }, { quoted: msg });
};
