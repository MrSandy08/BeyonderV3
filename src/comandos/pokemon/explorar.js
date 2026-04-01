// src/comandos/pokemon/explorar.js
import User from "../../database/models/User.js";
import { aviso } from "../../utils/format.js";
import { getPokemonData, renderPokemonCard } from "../../services/pokemonService.js";
import { encounters } from "../../store/encounters.js";

export const name      = "explorar";
export const aliases   = ["explore"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

export const run = async (contexto) => {
  const { reply, sender, from, sock } = contexto;

  const user = await User.findOne({ jid: sender, groupId: from }).lean();
  
  if (!user?.started) {
    return reply(aviso("Debes usar *!comenzar* antes de explorar el mundo."));
  }

  // Generar un ID aleatorio entre 1 y 151 (Kanto)
  // Evitar tipos agua si se desea mantener la lógica anterior, 
  // pero para explorar suele ser cualquier terrestre/aire.
  let wildPokeData = null;
  let attempts = 0;
  
  while (!wildPokeData && attempts < 10) {
    const randomId = Math.floor(Math.random() * 151) + 1;
    const data = await getPokemonData(randomId);
    if (data && !data.types.includes("water")) {
      wildPokeData = data;
    }
    attempts++;
  }

  if (!wildPokeData) wildPokeData = await getPokemonData(16); // Pidgey por defecto

  // Guardar encuentro en el store (válido por 5 minutos)
  encounters.set(from + sender, {
    pokemon: wildPokeData,
    timestamp: Date.now()
  });

  const buffer = await renderPokemonCard(wildPokeData);

  let txt = `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n`;
  txt += `🌿 EXPLORANDO LA HIERBA ALTA...\n`;
  txt += `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n`;
  txt += `💥 ¡Un *${wildPokeData.name.toUpperCase()}* salvaje ha aparecido! 💥\n\n`;
  txt += `¿Qué quieres hacer?\n`;
  txt += `🔴 Usa *!atrapar* para intentar capturarlo.\n`;
  txt += `🏃 O usa cualquier otro comando para huir.`;

  return await sock.sendMessage(from, { 
    image: buffer, 
    caption: txt 
  }, { quoted: contexto.msg });
};
