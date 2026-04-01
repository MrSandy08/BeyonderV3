// src/comandos/pokemon/elegir.js
import User from "../../database/models/User.js";
import UserPokemon from "../../database/models/UserPokemon.js";
import { aviso } from "../../utils/format.js";
import { getPokemonData, renderPokemonCard } from "../../services/pokemonService.js";

export const name      = "elegir";
export const aliases   = ["choose"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

const INICIALES = ["Bulbasaur", "Charmander", "Squirtle", "Pikachu", "Eevee"];

export const run = async (contexto) => {
  const { reply, sender, from, args, sock } = contexto;

  const user = await User.findOne({ jid: sender, groupId: from }).lean();
  
  if (user?.started) {
    return reply(aviso("Ya has elegido a tu Pokémon inicial."));
  }

  if (!args[0]) {
    return reply(aviso("Escribe el nombre del inicial que deseas elegir.\n       𝄄   _Ej: !elegir Squirtle_"));
  }

  const elegido = args[0].charAt(0).toUpperCase() + args[0].slice(1).toLowerCase();
  
  if (!INICIALES.includes(elegido)) {
    return reply(aviso(`Ese no es un inicial válido. Elige entre: ${INICIALES.join(", ")}`));
  }

  // Obtener datos de la PokeAPI
  const pokeData = await getPokemonData(elegido);

  if (!pokeData) {
    return reply(aviso("Error al obtener los datos del Pokémon. Inténtalo de nuevo."));
  }

  // Crear el primer Pokémon con stats de la API
  await UserPokemon.create({
    owner:      sender,
    groupId:    from,
    pokeID:     pokeData.id,
    nickname:   elegido,
    hp_current: pokeData.stats.hp,
    hp_max:     pokeData.stats.hp,
    atk:        pokeData.stats.atk,
    def:        pokeData.stats.def,
    spd:        pokeData.stats.spd,
    level:      5,
    xp:         0,
    isFavorite: true,
  });

  // Marcar al usuario como que ya empezó
  await User.findOneAndUpdate(
    { jid: sender, groupId: from },
    { $set: { started: true } },
    { upsert: true }
  );

  const buffer = await renderPokemonCard(pokeData);

  let txt = `✨ ¡FELICIDADES, ENTRENADOR! ✨\n\n`;
  txt += `Has elegido a *${elegido}* como tu primer compañero. 🎉\n\n`;
  txt += `¡Es hora de explorar, minar y pescar para fortalecer tu equipo!\n\n`;
  txt += `Usa *!explorar* para buscar Pokémon salvajes o *!minar* para ganar oro.`;

  return await sock.sendMessage(from, { 
    image: buffer, 
    caption: txt 
  }, { quoted: contexto.msg });
};
