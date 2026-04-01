import User from "../../database/models/User.js";
import { aviso } from "../../utils/format.js";
import { renderInventoryUI } from "../../services/pokemonService.js";

export const name      = "tienda";
export const aliases   = ["shop-poke"];

const ITEMS = {
  "1": { name: "Pokéball", price: 100, dbField: "balls", color: "#e74c3c" },
  "2": { name: "Poción", price: 200, dbField: "potions", color: "#2ecc71" } // Ejemplo extra
};

export const run = async (contexto) => {
  const { reply, sender, from, args, sock, msg } = contexto;

  const user = await User.findOne({ jid: sender, groupId: from });
  if (!user?.started) return reply(aviso("Usa *!comenzar* primero."));

  if (args.length === 0 || args[0] === "menu") {
    const itemsUI = Object.entries(ITEMS).map(([id, item]) => ({
      name: `${id}. ${item.name}`,
      price: item.price,
      qty: user[item.dbField] || 0,
      color: item.color
    }));

    const buffer = await renderInventoryUI("Tienda Pokémon", user.gold, itemsUI);
    return await sock.sendMessage(from, { image: buffer, caption: "🛒 *TIENDA POKÉMON*\nUsa `!tienda comprar [id] [cantidad]` para adquirir objetos." }, { quoted: msg });
  }

  if (args[0] === "comprar") {
    const id = args[1];
    const qty = Math.max(1, parseInt(args[2]) || 1);
    const item = ITEMS[id];

    if (!item) return reply(aviso("ID de objeto no válido."));

    const totalCost = item.price * qty;
    if (user.gold < totalCost) return reply(aviso(`Necesitas ${totalCost} de oro.`));

    // Actualización de DB
    user.gold -= totalCost;
    user[item.dbField] = (user[item.dbField] || 0) + qty;
    await user.save();

    const itemsUI = [{ name: item.name, qty: user[item.dbField], color: item.color }];
    const buffer = await renderInventoryUI("Compra Exitosa", user.gold, itemsUI);
    
    return await sock.sendMessage(from, { 
      image: buffer, 
      caption: `✅ Compraste x${qty} ${item.name} por ${totalCost} de oro.` 
    }, { quoted: msg });
  }
};
