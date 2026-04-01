import User from "../../database/models/User.js";
import { renderInventoryUI } from "../../services/pokemonService.js";

export const name      = "inventory";
export const aliases   = ["inventario", "inv"];

export const run = async (contexto) => {
  const { sender, from, sock, msg } = contexto;

  const user = await User.findOne({ jid: sender, groupId: from }).lean();
  if (!user) return;

  const itemsUI = [];

  if (user.balls > 0) itemsUI.push({ name: "Pokéballs", qty: user.balls, color: "#e74c3c" });
  
  const { minerals, fish } = user.inventory || {};
  
  const DATA = {
    stone: "Piedra", coal: "Carbón", copper: "Cobre", iron: "Hierro",
    ruby_sapphire: "Rubí/Zafiro", diamond: "Diamante",
    fire_stone: "Piedra Fuego", water_stone: "Piedra Agua", thunder_stone: "Piedra Trueno",
    common: "Pez Común", puffer: "Pez Globo", salmon: "Salmón",
    eel: "Anguila", leviathan: "Leviatán", kraken: "Kraken"
  };

  for (const [key, qty] of Object.entries(minerals || {})) {
    if (qty > 0) itemsUI.push({ name: DATA[key] || key, qty });
  }

  for (const [key, qty] of Object.entries(fish || {})) {
    if (qty > 0) itemsUI.push({ name: DATA[key] || key, qty, color: "#3498db" });
  }

  const buffer = await renderInventoryUI("Tu Inventario", user.gold, itemsUI.slice(0, 5)); // Mostrar primeros 5
  
  return await sock.sendMessage(from, { 
    image: buffer, 
    caption: `🎒 *TU INVENTARIO*\n💰 Oro: \`${user.gold}\`` 
  }, { quoted: msg });
};
