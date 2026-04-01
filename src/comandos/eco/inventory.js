// src/comandos/eco/inventory.js
import User from "../../database/models/User.js";

export const name      = "inventory";
export const aliases   = ["inventario", "inv"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

export const run = async (contexto) => {
  const { reply, sender, from } = contexto;

  const user = await User.findOne({ jid: sender, groupId: from }).lean();
  if (!user || !user.inventory) {
    return reply("Inventario vacío.");
  }

  const { minerals, fish } = user.inventory;

  // Precios y pesos para cálculo de carga
  const DATA = {
    stone: { name: "Piedra", weight: 1.2 },
    coal: { name: "Carbón", weight: 0.8 },
    copper: { name: "Cobre", weight: 2.5 },
    iron: { name: "Hierro", weight: 4.0 },
    ruby_sapphire: { name: "Rubí/Zafiro", weight: 0.5 },
    diamond: { name: "Diamante", weight: 0.2 },
    fire_stone: { name: "Piedra Fuego", weight: 0.5 },
    water_stone: { name: "Piedra Agua", weight: 0.5 },
    thunder_stone: { name: "Piedra Trueno", weight: 0.5 },
    common: { name: "Pez Común", weight: 1.5 },
    puffer: { name: "Pez Globo", weight: 0.8 },
    salmon: { name: "Salmón", weight: 3.2 },
    eel: { name: "Anguila", weight: 5.0 },
    leviathan: { name: "Leviatán", weight: 150.0 },
    kraken: { name: "Kraken", weight: 300.0 }
  };

  let totalWeight = 0;
  let itemsTxt = "";

  // Mostrar Pokéballs (No pesan en este sistema)
  if (user.balls > 0) {
    itemsTxt += `   - Pokéballs (\`x${user.balls}\`) 🔴\n`;
  }

  // Procesar minerales y piedras
  for (const [key, qty] of Object.entries(minerals || {})) {
    if (qty > 0) {
      const item = DATA[key];
      if (item) {
        totalWeight += item.weight * qty;
        itemsTxt += `   - ${item.name} (\`x${qty}\`)\n`;
      }
    }
  }

  // Procesar peces
  for (const [key, qty] of Object.entries(fish || {})) {
    if (qty > 0) {
      const item = DATA[key];
      totalWeight += item.weight * qty;
      itemsTxt += `   - ${item.name} (\`x${qty}\`)\n`;
    }
  }

  let txt = `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n`;
  txt += `🎒 TU MOCHILA DE AVENTURERO\n`;
  txt += `🪙 Oro: ${user.gold || 0}\n`;
  txt += `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n`;
  
  txt += `📦 *OBJETOS:*\n`;
  txt += itemsTxt || "   - (Vacío)\n";
  
  txt += `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n`;
  txt += `⚖️ Carga: \`${totalWeight.toFixed(1)}kg\` / \`${user.maxWeight || 50}kg\`\n`;
  txt += `Usa \`!vender [ítem]\` para comerciar.`;

  return reply(txt);
};
