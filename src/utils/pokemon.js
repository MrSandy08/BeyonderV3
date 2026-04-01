// src/utils/pokemon.js
import UserPokemon from "../database/models/UserPokemon.js";

/**
 * Actualiza la energía de un Pokémon basada en el tiempo transcurrido desde el último descanso.
 * Recupera 10 de energía por cada hora (ejemplo).
 */
export const updatePokemonEnergy = async (pokeId) => {
  const poke = await UserPokemon.findById(pokeId);
  if (!poke) return null;

  const now = Date.now();
  const diffMs = now - new Date(poke.lastRest).getTime();
  const hoursPassed = diffMs / (1000 * 60 * 60);
  
  // Recuperar 10 de energía por hora
  const recovery = Math.floor(hoursPassed * 10);
  
  if (recovery > 0) {
    const newEnergy = Math.min(100, (poke.energy || 0) + recovery);
    
    return await UserPokemon.findByIdAndUpdate(
      pokeId,
      { 
        $set: { energy: newEnergy, lastRest: now } 
      },
      { new: true }
    );
  }

  return poke;
};
