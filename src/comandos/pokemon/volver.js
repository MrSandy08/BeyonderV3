import Combat from "../../database/models/Combat.js";
import { renderBattleScene } from "../../services/pokemonService.js";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

export const name      = "volver";
export const aliases   = ["back"];

export const run = async (contexto) => {
  const { reply, sender, from, sock, msg } = contexto;

  const combat = await Combat.findOne({ jid: sender, groupId: from, isActive: true })
    .populate("playerPokemonId");
  
  if (!combat) return;

  // Cambiar estado a menú principal
  combat.menu = "main";
  await combat.save();

  const playerPoke = combat.playerPokemonId;

  const buffer = await renderBattleScene(
    playerPoke, 
    combat.enemy, 
    combat.playerHP, 
    combat.enemy.hp_current, 
    "main"
  );

  return await sock.sendMessage(from, { image: buffer }, { quoted: msg });
};
