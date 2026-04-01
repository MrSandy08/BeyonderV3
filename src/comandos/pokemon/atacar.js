// src/comandos/pokemon/atacar.js
import UserPokemon from "../../database/models/UserPokemon.js";
import Combat      from "../../database/models/Combat.js";
import User        from "../../database/models/User.js";
import { aviso, renderBar } from "../../utils/format.js";
import { calculateRequiredXP } from "../../utils/pokemon.js";
import { renderBattleScene } from "../../services/pokemonService.js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

export const name      = "ataque";
export const aliases   = ["atacar", "attack"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

const calcularDano = (atk, def, power) => {
  if (power === 0) return 0;
  const base = (atk * 0.5) - (def * 0.2);
  const random = Math.floor(Math.random() * 6);
  // Multiplicador por potencia del movimiento (simplificado)
  const powerMult = power / 40; 
  return Math.max(1, Math.floor((base + random) * powerMult));
};

export const run = async (contexto) => {
  const { reply, sender, from, args, sock, msg } = contexto;

  // 1. Buscar combate activo
  const combat = await Combat.findOne({ jid: sender, groupId: from, isActive: true })
    .populate("playerPokemonId");
  
  if (!combat) return reply(aviso("No estás en ningún combate activo. Usa *!explorar* o *!pescar*."));

  const playerPoke = combat.playerPokemonId;
  const enemyPoke  = combat.enemy;

  // 2. Selección de movimiento
  const moveIndex = parseInt(args[0]) - 1;
  if (isNaN(moveIndex) || moveIndex < 0 || moveIndex > 3) {
    return reply(aviso("Debes elegir un movimiento del 1 al 4.\nEjemplo: *!ataque 1*"));
  }

  const moveName = playerPoke.moves[moveIndex];
  if (!moveName) {
    return reply(aviso("¡Tu Pokémon no conoce un movimiento en este slot!"));
  }

  // Cargar datos del movimiento
  const movesPath = join(__dirname, "..", "..", "database", "moves.json");
  const movesData = JSON.parse(readFileSync(movesPath, "utf-8"));
  const moveInfo = movesData.find(m => m.name === moveName) || { name: moveName, power: 40 };

  let log = "";
  let pHP = combat.playerHP;
  let eHP = combat.enemy.hp_current;

  // 3. Determinar quién ataca primero basado en SPD
  const playerFirst = playerPoke.spd >= enemyPoke.spd;

  const playerTurn = async () => {
    if (pHP <= 0) return;
    const dano = calcularDano(playerPoke.atk, enemyPoke.def, moveInfo.power);
    eHP = Math.max(0, eHP - dano);
    log += `💥 *${playerPoke.nickname}* usó *${moveInfo.name}* y causó \`${dano}\` de daño.\n`;
    if (eHP <= 0) log += `🌟 ¡El *${enemyPoke.name}* salvaje se ha debilitado!\n`;
  };

  const enemyTurn = async () => {
    if (eHP <= 0) return;
    // Enemigo usa Placaje por defecto (40 power)
    const dano = calcularDano(enemyPoke.atk, playerPoke.def, 40);
    pHP = Math.max(0, pHP - dano);
    log += `👾 *${enemyPoke.name}* contraataca y causa \`${dano}\` de daño.\n`;
    if (pHP <= 0) log += `💀 *${playerPoke.nickname}* se ha debilitado...\n`;
  };

  if (playerFirst) {
    await playerTurn();
    await enemyTurn();
  } else {
    await enemyTurn();
    await playerTurn();
  }

  // 4. Actualizar estado en DB y calcular XP
  let xpGain = 0;
  let goldGain = 0;
  let levelUpMsg = "";

  if (eHP <= 0) {
    // Victoria
    xpGain = 20 + Math.floor(Math.random() * 30);
    goldGain = 50 + Math.floor(Math.random() * 100);
    
    let newXp = playerPoke.xp + xpGain;
    let newLevel = playerPoke.level;
    let reqXp = calculateRequiredXP(newLevel);

    // Lógica de subida de nivel
    while (newXp >= reqXp) {
      newXp -= reqXp;
      newLevel++;
      reqXp = calculateRequiredXP(newLevel);
      levelUpMsg += `\n🎉 ¡*${playerPoke.nickname}* ha subido al Nivel ${newLevel}! 🎉`;
      // Aumentar stats al subir de nivel
      playerPoke.hp_max += 2;
      playerPoke.atk += 1;
      playerPoke.def += 1;
      playerPoke.spd += 1;
    }

    playerPoke.xp = newXp;
    playerPoke.level = newLevel;
    playerPoke.hp_current = playerPoke.hp_max; // Se cura al subir de nivel (opcional)
    await playerPoke.save();

    await User.findOneAndUpdate({ jid: sender, groupId: from }, { $inc: { gold: goldGain } });
    
    combat.isActive = false;
    log += `\n✨ Has ganado \`${xpGain} XP\` y \`${goldGain} Oro\` 🪙`;
    if (levelUpMsg) log += levelUpMsg;
  } else if (pHP <= 0) {
    // Derrota
    combat.isActive = false;
    // Actualizar vida del pokemon en la DB
    await UserPokemon.findByIdAndUpdate(playerPoke._id, { $set: { hp_current: 0 } });
  }

  combat.enemy.hp_current = eHP;
  combat.playerHP = pHP;
  combat.lastUpdate = Date.now();
  await combat.save();

  // 5. Renderizar nueva escena
  const buffer = await renderBattleScene(playerPoke, enemyPoke, pHP, eHP);

  let caption = `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n`;
  caption += log;
  caption += `\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`;

  return await sock.sendMessage(from, { 
    image: buffer, 
    caption: caption 
  }, { quoted: msg });
};
