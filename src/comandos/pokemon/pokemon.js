// src/comandos/pokemon/pokemon.js
import UserPokemon from "../../database/models/UserPokemon.js";
import { pokeStats, aviso } from "../../utils/format.js";
import { updatePokemonEnergy } from "../../utils/pokemon.js";
import { getPokemonData, renderPokemonCard } from "../../services/pokemonService.js";

export const name      = "pokemon";
export const aliases   = ["mypoke", "poke"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

export const run = async (contexto) => {
  const { reply, sender, from, sock } = contexto;

  // Buscar el pokémon favorito o el primero que tenga
  let poke = await UserPokemon.findOne({ owner: sender, groupId: from, isFavorite: true }).lean();
  if (!poke) {
    poke = await UserPokemon.findOne({ owner: sender, groupId: from }).lean();
  }

  if (!poke) {
    return reply(aviso("No tienes ningún Pokémon. ¡Usa *!comenzar* para empezar!"));
  }

  // Actualizar energía antes de mostrar
  const updatedPoke = await updatePokemonEnergy(poke._id);
  const pokeToShow = updatedPoke || poke;

  // Obtener datos de la API para el renderizado
  const apiData = await getPokemonData(pokeToShow.pokeID);
  const cardBuffer = await renderPokemonCard(apiData);

  return await sock.sendMessage(from, { 
    image: cardBuffer, 
    caption: pokeStats(pokeToShow) 
  }, { quoted: contexto.msg });
};
