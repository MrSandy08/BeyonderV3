// src/comandos/pokemon/atrapar.js
import User from "../../database/models/User.js";
import UserPokemon from "../../database/models/UserPokemon.js";
import Combat      from "../../database/models/Combat.js";
import { aviso }   from "../../utils/format.js";
import { getRandomNature, applyNature } from "../../utils/pokemon.js";

export const name      = "atrapar";
export const aliases   = ["catch"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

export const run = async (contexto) => {
  const { reply, sender, from, react } = contexto;

  // 1. Buscar combate activo
  const combat = await Combat.findOne({ jid: sender, groupId: from, isActive: true });
  
  if (!combat) return reply(aviso("No estás en ningún combate activo."));

  const user = await User.findOne({ jid: sender, groupId: from }).lean();
  
  if ((user.balls || 0) < 1) {
    return reply(aviso("❌ ¡No tienes Pokéballs! Compra algunas en la *!tienda*."));
  }

  const wildPoke = combat.enemy;
  
  // Consumir Pokéball
  await User.findOneAndUpdate(
    { jid: sender, groupId: from },
    { $inc: { balls: -1 } }
  );

  await react("💫");

  // Probabilidad de captura (Aumenta si el HP es bajo)
  // Base 30% + hasta 40% adicional si la vida es 0
  const hpRatio = wildPoke.hp_current / wildPoke.hp_max;
  const catchRate = 0.30 + (0.40 * (1 - hpRatio));
  
  const success = Math.random() < catchRate;

  if (success) {
    // Asignar naturaleza y aplicar modificadores
    const nature = getRandomNature();
    const baseStats = { hp: wildPoke.hp_max, atk: wildPoke.atk, def: wildPoke.def, spd: wildPoke.spd };
    const modifiedStats = applyNature(baseStats, nature);

    await UserPokemon.create({
      owner:      sender,
      groupId:    from,
      pokeID:     wildPoke.pokeID,
      nickname:   wildPoke.name,
      hp_current: modifiedStats.hp, // Se cura al atraparlo
      hp_max:     modifiedStats.hp,
      atk:        modifiedStats.atk,
      def:        modifiedStats.def,
      spd:        modifiedStats.spd,
      nature:     nature.name,
      moves:      ["Placaje", "Gruñido"], // Moveset básico
      level:      wildPoke.level,
      xp:         0,
    });

    combat.isActive = false;
    await combat.save();

    let txt = `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n`;
    txt += `🌟 ¡HAS ATRAPADO A *${wildPoke.name.toUpperCase()}*! 🌟\n`;
    txt += `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n`;
    txt += `📦 ¡El Pokémon se ha unido a tu equipo! 🎉\n`;
    txt += `🌿 Naturaleza: *${nature.name}*\n`;
    txt += `🔴 Te quedan: \`${(user.balls || 1) - 1} Pokéballs\`\n`;
    txt += `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`;
    
    return reply(txt);
  } else {
    // Si falla, el Pokémon contraataca automáticamente
    const dano = Math.floor((wildPoke.atk * 0.5) + Math.random() * 5);
    const newPlayerHP = Math.max(0, combat.playerHP - dano);
    
    combat.playerHP = newPlayerHP;
    if (newPlayerHP <= 0) combat.isActive = false;
    await combat.save();

    let txt = `💫 ¡Casi! El *${wildPoke.name}* se ha salido de la Pokéball.\n`;
    txt += `👾 ¡Aprovecha para contraatacar y te quita \`${dano}\` de vida!`;
    
    if (newPlayerHP <= 0) txt += `\n💀 *Tu Pokémon se ha debilitado...*`;

    return reply(aviso(txt));
  }
};
