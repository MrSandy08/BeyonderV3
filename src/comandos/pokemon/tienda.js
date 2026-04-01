// src/comandos/pokemon/tienda.js
import User from "../../database/models/User.js";
import { aviso } from "../../utils/format.js";

export const name      = "tienda";
export const aliases   = ["shop-poke"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

const PRECIO_BALL = 100;

export const run = async (contexto) => {
  const { reply, sender, from, args } = contexto;

  const user = await User.findOne({ jid: sender, groupId: from }).lean();
  
  if (!user?.started) {
    return reply(aviso("Debes usar *!comenzar* antes de entrar a la tienda."));
  }

  if (args.length === 0) {
    let txt = `🏪 *TIENDA POKÉMON* 🏪\n`;
    txt += `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n`;
    txt += `💰 Tu Saldo: \`${user.gold || 0} Oro\` 🪙\n`;
    txt += `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n`;
    txt += `🔴 *Pokéball* → \`${PRECIO_BALL} Oro\`\n`;
    txt += `   _Uso: !tienda comprar [cantidad]_\n\n`;
    txt += `¡Equípate bien antes de salir a explorar!`;
    return reply(txt);
  }

  if (args[0].toLowerCase() === "comprar") {
    const qty = parseInt(args[1]) || 1;
    if (qty < 1) return reply(aviso("La cantidad debe ser mayor a 0."));

    const totalCost = PRECIO_BALL * qty;

    if ((user.gold || 0) < totalCost) {
      return reply(aviso(`❌ No tienes suficiente oro. Necesitas \`${totalCost}\` y tienes \`${user.gold || 0}\`.`));
    }

    await User.findOneAndUpdate(
      { jid: sender, groupId: from },
      { 
        $inc: { gold: -totalCost, balls: qty } 
      }
    );

    let txt = `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n`;
    txt += `✅ COMPRA REALIZADA\n`;
    txt += `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n`;
    txt += `📦 Has comprado: \`x${qty} Pokéballs\`\n`;
    txt += `💰 Oro Gastado: \`-${totalCost}\` 🪙\n`;
    txt += `🔴 Total en Inventario: \`${(user.balls || 0) + qty} Pokéballs\`\n`;
    txt += `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`;

    return reply(txt);
  }

  return reply(aviso("Uso: *!tienda comprar [cantidad]*"));
};
