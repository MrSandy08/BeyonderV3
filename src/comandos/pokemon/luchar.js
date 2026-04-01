import Combat from "../../database/models/Combat.js";
import { renderBattleScene } from "../../services/pokemonService.js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

export const name      = "luchar";
export const aliases   = ["fight"];

export const run = async (contexto) => {
  const { reply, sender, from, sock, msg } = contexto;

  const combat = await Combat.findOne({ jid: sender, groupId: from, isActive: true })
    .populate("playerPokemonId");
  
  if (!combat) return;

  // Cambiar estado a menú de lucha
  combat.menu = "fight";
  await combat.save();

  const playerPoke = combat.playerPokemonId;
  
  // Cargar datos de movimientos para el renderizado
  const movesPath = join(__dirname, "..", "..", "database", "moves.json");
  const movesData = JSON.parse(readFileSync(movesPath, "utf-8"));

  const buffer = await renderBattleScene(
    playerPoke, 
    combat.enemy, 
    combat.playerHP, 
    combat.enemy.hp_current, 
    "fight",
    movesData
  );

  return await sock.sendMessage(from, { image: buffer }, { quoted: msg });
};
