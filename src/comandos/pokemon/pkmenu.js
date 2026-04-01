// src/comandos/pokemon/pkmenu.js
import { aviso } from "../../utils/format.js";

export const name      = "pkmenu";
export const aliases   = ["pokemon-menu", "pkm"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

export const run = async (contexto) => {
  const { reply } = contexto;

  let txt = `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n`;
  txt += `🎮 *MENÚ POKÉMON & ECONOMÍA* 🎮\n`;
  txt += `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n`;
  
  txt += `🌟 *INICIO Y PERFIL*\n`;
  txt += ` 𝄄➥ *!comenzar* → Inicia tu aventura.\n`;
  txt += ` 𝄄➥ *!elegir* → Elige a tu inicial.\n`;
  txt += ` 𝄄➥ *!pokemon* → Mira a tu compañero actual.\n\n`;

  txt += `🌿 *AVENTURA*\n`;
  txt += ` 𝄄➥ *!explorar* → Busca Pokémon en la hierba.\n`;
  txt += ` 𝄄➥ *!pescar* → Encuentros en el agua.\n`;
  txt += ` 𝄄➥ *!atacar* → Lucha en un combate activo.\n`;
  txt += ` 𝄄➥ *!atrapar* → Usa una Pokéball.\n\n`;

  txt += `⛏️ *ECONOMÍA*\n`;
  txt += ` 𝄄➥ *!minar* → Gana oro y piedras evolutivas.\n`;
  txt += ` 𝄄➥ *!vender* → Vende tus recursos.\n`;
  txt += ` 𝄄➥ *!tienda* → Compra Pokéballs.\n`;
  txt += ` 𝄄➥ *!inventory* → Mira tu mochila.\n\n`;

  txt += `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n`;
  txt += `¡Conviértete en el mejor entrenador! 🏆`;

  return reply(txt);
};
