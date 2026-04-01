// src/comandos/pokemon/atrapar.js
import User from "../../database/models/User.js";
import UserPokemon from "../../database/models/UserPokemon.js";
import { aviso } from "../../utils/format.js";
import { encounters } from "../../store/encounters.js";

export const name      = "atrapar";
export const aliases   = ["catch"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

export const run = async (contexto) => {
  const { reply, sender, from, react } = contexto;

  const encounter = encounters.get(from + sender);
  
  if (!encounter || (Date.now() - encounter.timestamp) > 5 * 60 * 1000) {
    encounters.delete(from + sender);
    return reply(aviso("No tienes ningún encuentro activo o el Pokémon ha huido."));
  }

  const user = await User.findOne({ jid: sender, groupId: from }).lean();
  
  if ((user.balls || 0) < 1) {
    return reply(aviso("❌ ¡No tienes Pokéballs! Compra algunas en la *!tienda*."));
  }

  const wildPoke = encounter.pokemon;
  
  // Consumir Pokéball
  await User.findOneAndUpdate(
    { jid: sender, groupId: from },
    { $inc: { balls: -1 } }
  );

  await react("🔴");

  // Probabilidad de captura (40% base)
  const success = Math.random() < 0.40;

  if (success) {
    await UserPokemon.create({
      owner:      sender,
      groupId:    from,
      pokeID:     wildPoke.id,
      nickname:   wildPoke.name,
      hp_current: wildPoke.hp,
      hp_max:     wildPoke.hp,
      level:      Math.floor(Math.random() * 5) + 5, // Nivel 5-10 salvaje
      xp:         0,
    });

    encounters.delete(from + sender);

    let txt = `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n`;
    txt += `🌟 ¡HAS ATRAPADO A *${wildPoke.name.toUpperCase()}*! 🌟\n`;
    txt += `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n`;
    txt += `📦 ¡El Pokémon se ha unido a tu equipo! 🎉\n`;
    txt += `🔴 Te quedan: \`${(user.balls || 1) - 1} Pokéballs\`\n`;
    txt += `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`;
    
    return reply(txt);
  } else {
    // Si falla, el Pokémon se queda o huye (30% de probabilidad de huir)
    const runsAway = Math.random() < 0.30;
    
    if (runsAway) {
      encounters.delete(from + sender);
      return reply(aviso(`💨 ¡Oh no! El *${wildPoke.name}* se ha escapado de la Pokéball y ha huido.`));
    } else {
      return reply(aviso(`💫 ¡Casi! El *${wildPoke.name}* se ha salido de la Pokéball, pero sigue ahí. ¡Inténtalo de nuevo!`));
    }
  }
};
