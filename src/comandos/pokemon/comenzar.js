// src/comandos/pokemon/comenzar.js
import User from "../../database/models/User.js";
import { aviso } from "../../utils/format.js";
import { getPokemonData, renderPokemonCard } from "../../services/pokemonService.js";

export const name      = "comenzar";
export const aliases   = ["start-pokemon"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

export const run = async (contexto) => {
  const { reply, sender, from, sock } = contexto;

  const user = await User.findOne({ jid: sender, groupId: from }).lean();
  
  if (user?.started) {
    return reply(aviso("Ya has comenzado tu aventura Pokémon. ¡Sigue explorando!"));
  }

  // IDs de los iniciales: Bulbasaur(1), Charmander(4), Squirtle(7), Pikachu(25), Eevee(133)
  const inicialesIds = [1, 4, 7, 25, 133];
  
  // Generar una imagen combinada o mostrar solo a Eevee como ejemplo principal
  // Por simplicidad y velocidad, mostramos un mensaje con los nombres y una imagen de Eevee (#133)
  const eeveeData = await getPokemonData(133);
  const buffer = await renderPokemonCard(eeveeData);

  let txt = `🌟 *¡BIENVENIDO AL MUNDO POKÉMON!* 🌟\n\n`;
  txt += `Hola, joven Entrenador. Es hora de elegir a tu primer compañero.\n\n`;
  txt += `🌿 *Bulbasaur* (#1)\n`;
  txt += `🔥 *Charmander* (#4)\n`;
  txt += `💧 *Squirtle* (#7)\n`;
  txt += `⚡ *Pikachu* (#25)\n`;
  txt += `🦊 *Eevee* (#133)\n\n`;
  txt += `Usa el comando *!elegir [nombre]* para tomar tu decisión.\n`;
  txt += `_Ejemplo: !elegir Eevee_`;

  return await sock.sendMessage(from, { 
    image: buffer, 
    caption: txt 
  }, { quoted: contexto.msg });
};
