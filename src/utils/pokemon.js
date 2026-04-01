// src/utils/pokemon.js
import UserPokemon from "../database/models/UserPokemon.js";

export const NATURES = [
  { name: "Fuerte",   plus: "atk", minus: "def" },
  { name: "Huraña",   plus: "atk", minus: "def" },
  { name: "Audaz",    plus: "atk", minus: "spd" },
  { name: "Firme",    plus: "atk", minus: "sp_atk" },
  { name: "Pícara",   plus: "atk", minus: "sp_def" },
  { name: "Osada",    plus: "def", minus: "atk" },
  { name: "Dócil",    plus: "def", minus: "atk" },
  { name: "Plácida",  plus: "def", minus: "spd" },
  { name: "Agitada",  plus: "def", minus: "spd" },
  { name: "Floja",    plus: "def", minus: "sp_atk" },
  { name: "Miedosa",  plus: "spd", minus: "atk" },
  { name: "Activa",   plus: "spd", minus: "def" },
  { name: "Alegre",   plus: "spd", minus: "sp_atk" },
  { name: "Ingenua",  plus: "spd", minus: "sp_def" },
  { name: "Modesta",  plus: "sp_atk", minus: "atk" },
  { name: "Afable",   plus: "sp_atk", minus: "def" },
  { name: "Mansa",    plus: "sp_atk", minus: "def" },
  { name: "Alocada",  plus: "sp_atk", minus: "spd" },
  { name: "Serena",   plus: "sp_def", minus: "atk" },
  { name: "Amable",   plus: "sp_def", minus: "def" },
  { name: "Cauta",    plus: "sp_def", minus: "def" },
  { name: "Grosera",  plus: "sp_def", minus: "spd" },
  { name: "Rara",     plus: null, minus: null },
  { name: "Tímida",   plus: null, minus: null },
  { name: "Seria",    plus: null, minus: null }
];

export const getRandomNature = () => {
  return NATURES[Math.floor(Math.random() * NATURES.length)];
};

export const applyNature = (stats, nature) => {
  const newStats = { ...stats };
  if (nature.plus && newStats[nature.plus]) newStats[nature.plus] = Math.floor(newStats[nature.plus] * 1.1);
  if (nature.minus && newStats[nature.minus]) newStats[nature.minus] = Math.floor(newStats[nature.minus] * 0.9);
  return newStats;
};

export const calculateRequiredXP = (level) => {
  // Fórmula simple: Nivel al cubo
  return Math.floor(Math.pow(level, 3));
};

export const updatePokemonEnergy = async (pokeId) => {
  const poke = await UserPokemon.findById(pokeId);
  if (!poke) return null;

  const now = Date.now();
  const diffMs = now - new Date(poke.lastRest).getTime();
  const hoursPassed = diffMs / (1000 * 60 * 60);
  
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
