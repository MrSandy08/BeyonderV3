// src/comandos/eco/mine.js
import User from "../../database/models/User.js";

export const name      = "mine";
export const aliases   = ["minar"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

const COOLDOWN = 5 * 60 * 1000; // 5 minutos

const WEIGHTS = [
  { item: "stone",         weight: 6000, price: 5,   rarity: "⭐ (Común)",  stone_weight: 1.2 },
  { item: "coal",          weight: 2000, price: 15,  rarity: "⭐ (Común)",  stone_weight: 0.8 },
  { item: "copper",        weight: 1200, price: 40,  rarity: "⭐⭐ (Raro)", stone_weight: 2.5 },
  { item: "iron",          weight: 600,  price: 100, rarity: "⭐⭐ (Raro)", stone_weight: 4.0 },
  { item: "ruby_sapphire", weight: 198,  price: 500, rarity: "✨ (Épico)",   stone_weight: 0.5 },
  { item: "diamond",       weight: 2,    price: 2500,rarity: "💎 (Leyenda)", stone_weight: 0.2 },
];

export const run = async (contexto) => {
  const { reply, sender, from } = contexto;

  const user = await User.findOne({ jid: sender, groupId: from }).lean();
  const now  = Date.now();

  if (user && user.lastMine && (now - user.lastMine) < COOLDOWN) {
    const remaining = Math.ceil((COOLDOWN - (now - user.lastMine)) / 1000);
    return reply(`⏳ Debes esperar ${remaining} segundos para volver a minar.`);
  }

  // Sistema de pesos (1 a 10,000)
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

  const obtained = obtainedData.item;
  const durabilityLoss = Math.floor(Math.random() * 5) + 1;
  const newDurability = Math.max(0, (user?.pickaxeDurability || 100) - durabilityLoss);

  // 10% de probabilidad de encontrar una Piedra Evolutiva
  let evolutionaryStone = null;
  const randomStone = Math.random();
  if (randomStone < 0.10) {
    const stones = ["fire_stone", "water_stone", "thunder_stone"];
    evolutionaryStone = stones[Math.floor(Math.random() * stones.length)];
  }

  // Actualización atómica
  const updateQuery = { 
    $inc: { [`inventory.minerals.${obtained}`]: 1, gold: obtainedData.price },
    $set: { lastMine: now, pickaxeDurability: newDurability }
  };

  if (evolutionaryStone) {
    updateQuery.$inc[`inventory.minerals.${evolutionaryStone}`] = 1;
  }

  await User.findOneAndUpdate(
    { jid: sender, groupId: from },
    updateQuery,
    { upsert: true }
  );

  const emoji = {
    stone: "🪨", coal: "⬛", copper: "🥉", iron: "🥈", ruby_sapphire: "💎", diamond: "✨",
    fire_stone: "🔥", water_stone: "💧", thunder_stone: "⚡"
  }[evolutionaryStone || obtained];

  const traducciones = {
    stone: "Piedra",
    coal: "Carbón",
    copper: "Cobre",
    iron: "Hierro",
    ruby_sapphire: "Rubí/Zafiro",
    diamond: "Diamante",
    fire_stone: "Piedra Fuego",
    water_stone: "Piedra Agua",
    thunder_stone: "Piedra Trueno"
  };

  // Barra de durabilidad
  const totalBars = 10;
  const filledBars = Math.round((newDurability / 100) * totalBars);
  const emptyBars = totalBars - filledBars;
  const bar = "▰".repeat(filledBars) + "▱".repeat(emptyBars);

  let txt = `⛏️ MINANDO EN LAS PROFUNDIDADES...\n`;
  txt += `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n`;
  txt += `💎 ¡Has minado: [ *${traducciones[obtained]}* ]\n`;
  
  if (evolutionaryStone) {
    txt += `✨ ¡Y ENCONTRASTE UNA *${traducciones[evolutionaryStone].toUpperCase()}*! ✨\n`;
  }

  txt += `✨ Rareza: ${obtainedData.rarity}\n`;
  txt += `⚖️ Peso: ${obtainedData.stone_weight}kg\n`;
  txt += `💰 Oro Ganado: \`+${obtainedData.price}\` 🪙\n`;
  txt += `[${bar}] ${newDurability}%\n`;
  txt += `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`;

  await reply(txt);
};
