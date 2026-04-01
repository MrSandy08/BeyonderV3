import User from "../../database/models/User.js";
import { renderExplorationScene, getPokemonData, renderBattleScene } from "../../services/pokemonService.js";
import UserPokemon from "../../database/models/UserPokemon.js";
import Combat from "../../database/models/Combat.js";

export const name      = "fish";
export const aliases   = ["pescar"];

const COOLDOWN = 45 * 1000; // 45 segundos (Pedido por el usuario)

export const run = async (contexto) => {
  const { reply, sender, from, sock, msg } = contexto;

  const user = await User.findOne({ jid: sender, groupId: from });
  const now  = Date.now();

  if (user && user.lastFish && (now - user.lastFish) < COOLDOWN) {
    const remaining = Math.ceil((COOLDOWN - (now - user.lastFish)) / 1000);
    return reply(`⏳ Espera ${remaining}s.`);
  }

  // 60% prob de encuentro Pokémon
  if (Math.random() < 0.60) {
    let wildPokeData = null;
    let attempts = 0;
    while (!wildPokeData && attempts < 10) {
      const randomId = Math.floor(Math.random() * 151) + 1;
      const data = await getPokemonData(randomId);
      if (data && data.types.includes("water")) wildPokeData = data;
      attempts++;
    }
    if (!wildPokeData) wildPokeData = await getPokemonData(129); // Magikarp

    let playerPoke = await UserPokemon.findOne({ owner: sender, groupId: from, isFavorite: true }) || 
                     await UserPokemon.findOne({ owner: sender, groupId: from });

    const combat = await Combat.create({
      jid:             sender,
      groupId:         from,
      playerPokemonId: playerPoke._id,
      playerHP:        playerPoke.hp_current,
      enemy: {
        pokeID:     wildPokeData.id,
        name:       wildPokeData.name,
        level:      Math.floor(Math.random() * 5) + 5,
        hp_current: wildPokeData.stats.hp,
        hp_max:     wildPokeData.stats.hp,
        atk:        wildPokeData.stats.atk,
        def:        wildPokeData.stats.def,
        spd:        wildPokeData.stats.spd,
        types:      wildPokeData.types,
      }
    });

    const buffer = await renderBattleScene(playerPoke, combat.enemy, combat.playerHP, combat.enemy.hp_current, "main");
    await User.findOneAndUpdate({ jid: sender, groupId: from }, { $set: { lastFish: now } });

    return await sock.sendMessage(from, { 
      image: buffer, 
      caption: `🎣 ¡ALGO PICA!\n🌊 Un *${wildPokeData.name.toUpperCase()}* salvaje apareció.\n⚔️ Usa *!luchar* o 🔴 *!atrapar*.` 
    }, { quoted: msg });
  }

  // 40% encontrar basura/nada
  const goldGain = Math.floor(Math.random() * 50) + 10;
  await User.findOneAndUpdate({ jid: sender, groupId: from }, { $inc: { gold: goldGain }, $set: { lastFish: now } });

  const buffer = await renderExplorationScene("fishing", "Bota vieja", true);
  return await sock.sendMessage(from, { 
    image: buffer, 
    caption: `🎣 No hubo suerte, pero encontraste algo de chatarra. (+${goldGain} Oro)` 
  }, { quoted: msg });
};
