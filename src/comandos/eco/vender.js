// src/comandos/eco/vender.js
import User from "../../database/models/User.js";
import { aviso } from "../../utils/format.js";

export const name      = "vender";
export const aliases   = ["sell"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

// Precios de venta (50% del valor de compra o valores fijos)
const DATA = {
  // Minerales
  piedra:         { key: "minerals.stone",         price: 5,   weight: 1.2,  name: "Piedra" },
  carbon:         { key: "minerals.coal",          price: 15,  weight: 0.8,  name: "Carbón" },
  cobre:          { key: "minerals.copper",         price: 40,  weight: 2.5,  name: "Cobre" },
  hierro:         { key: "minerals.iron",           price: 100, weight: 4.0,  name: "Hierro" },
  "rubi/zafiro":  { key: "minerals.ruby_sapphire", price: 500, weight: 0.5,  name: "Rubí/Zafiro" },
  diamante:       { key: "minerals.diamond",       price: 2500,weight: 0.2,  name: "Diamante" },
  fuego:          { key: "minerals.fire_stone",    price: 1000,weight: 0.5,  name: "Piedra Fuego" },
  agua:           { key: "minerals.water_stone",   price: 1000,weight: 0.5,  name: "Piedra Agua" },
  trueno:         { key: "minerals.thunder_stone", price: 1000,weight: 0.5,  name: "Piedra Trueno" },
  // Peces
  comun:          { key: "fish.common",    price: 10,  weight: 1.5,  name: "Pez Común" },
  "pez globo":    { key: "fish.puffer",    price: 30,  weight: 0.8,  name: "Pez Globo" },
  salmon:         { key: "fish.salmon",    price: 75,  weight: 3.2,  name: "Salmón" },
  anguila:        { key: "fish.eel",       price: 200, weight: 5.0,  name: "Anguila" },
  leviatan:       { key: "fish.leviathan", price: 5000,weight: 150.0, name: "Leviatán" },
  kraken:         { key: "fish.kraken",    price: 8000,weight: 300.0, name: "Kraken" }
};

export const run = async (contexto) => {
  const { reply, sender, from, args } = contexto;

  if (args.length < 1) {
    return reply(aviso("Uso: `!vender [ítem] [cantidad]`\nEj: `!vender piedra 5`"));
  }

  // Normalizar entrada
  let itemName = args[0].toLowerCase();
  let qty = parseInt(args[1]) || 1;

  if (qty < 1) return reply(aviso("La cantidad debe ser mayor a 0."));

  // Buscar el ítem en la data
  const item = DATA[itemName];
  if (!item) {
    return reply(aviso(`Ese objeto no es válido para la venta. Consulta tu \`!inventory\`.`));
  }

  const user = await User.findOne({ jid: sender, groupId: from }).lean();
  if (!user || !user.inventory) return reply(aviso("Tu inventario está vacío."));

  // Obtener cantidad actual del usuario
  const pathParts = item.key.split('.');
  const currentQty = user.inventory[pathParts[0]]?.[pathParts[1]] || 0;

  if (currentQty < qty) {
    return reply(aviso(`❌ No tienes suficientes [ *${item.name}* ] en tu mochila (Posees: \`x${currentQty}\`).`));
  }

  // Cálculos
  const totalGold = item.price * qty;
  const weightFreed = item.weight * qty;

  // Actualización atómica
  await User.findOneAndUpdate(
    { jid: sender, groupId: from },
    { 
      $inc: { 
        [`inventory.${item.key}`]: -qty,
        gold: totalGold
      }
    }
  );

  let txt = `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n`;
  txt += `⚖️ TRANSACCIÓN EXITOSA\n`;
  txt += `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n`;
  txt += `🤝 Comerciante: "Trato hecho, viajero."\n`;
  txt += `📤 Vendido: [ *${item.name}* ] \`x${qty}\` \n`;
  txt += `🪙 Ganancia: \`+${totalGold} Oro\`\n`;
  txt += `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n`;
  txt += `💰 Tu Saldo Actual: \`${(user.gold || 0) + totalGold} Oro\`\n`;
  txt += `🎒 Espacio Liberado: \`${weightFreed.toFixed(1)}kg\`\n`;
  txt += `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`;

  await reply(txt);
};
