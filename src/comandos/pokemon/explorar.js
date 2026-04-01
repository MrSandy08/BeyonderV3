// src/comandos/pokemon/explorar.js
import User from "../../database/models/User.js";
import UserPokemon from "../../database/models/UserPokemon.js";
import Combat      from "../../database/models/Combat.js";
import { aviso }   from "../../utils/format.js";
import { getPokemonData, renderBattleScene } from "../../services/pokemonService.js";

export const name      = "explorar";
export const aliases   = ["explore"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

export const run = async (contexto) => {
  const { reply, sender, from, sock, msg } = contexto;

  const user = await User.findOne({ jid: sender, groupId: from }).lean();
  
  if (!user?.started) {
    return reply(aviso("Debes usar *!comenzar* antes de explorar el mundo."));
  }

  // Verificar si ya hay un combate activo
  const existingCombat = await Combat.findOne({ jid: sender, groupId: from, isActive: true });
  if (existingCombat) return reply(aviso("¡Ya estás en un combate! Usa *!atacar* o *!atrapar*."));

  // Obtener el Pokémon principal del usuario
  let playerPoke = await UserPokemon.findOne({ owner: sender, groupId: from, isFavorite: true });
  if (!playerPoke) playerPoke = await UserPokemon.findOne({ owner: sender, groupId: from });
  if (!playerPoke) return reply(aviso("No tienes ningún Pokémon. Usa *!comenzar*."));

  // Generar un ID aleatorio entre 1 y 151 (Kanto)
  let wildPokeData = null;
  let attempts = 0;
  while (!wildPokeData && attempts < 10) {
    const randomId = Math.floor(Math.random() * 151) + 1;
    const data = await getPokemonData(randomId);
    if (data && !data.types.includes("water")) wildPokeData = data;
    attempts++;
  }
  if (!wildPokeData) wildPokeData = await getPokemonData(16); // Pidgey

  // Crear combate en MongoDB
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

  let txt = `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n`;
  txt += `🌿 EXPLORANDO LA HIERBA ALTA...\n`;
  txt += `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n`;
  txt += `💥 ¡Un *${wildPokeData.name.toUpperCase()}* salvaje ha aparecido! 💥\n\n`;
  txt += `⚔️ Usa *!luchar* para ver tus ataques.\n`;
  txt += `🔴 Usa *!atrapar* para intentar capturarlo.\n`;
  txt += `🏃 Usa *!huir* para escapar.`;

  return await sock.sendMessage(from, { image: buffer, caption: txt }, { quoted: msg });
};
