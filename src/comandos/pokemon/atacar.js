// src/comandos/pokemon/atacar.js
import UserPokemon from "../../database/models/UserPokemon.js";
import Combat      from "../../database/models/Combat.js";
import User        from "../../database/models/User.js";
import { aviso }   from "../../utils/format.js";
import { renderBattleScene } from "../../services/pokemonService.js";

export const name      = "atacar";
export const aliases   = ["attack"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

const calcularDano = (atk, def) => {
  const base = (atk * 0.5) - (def * 0.2);
  const random = Math.floor(Math.random() * 6);
  return Math.max(1, Math.floor(base + random));
};

export const run = async (contexto) => {
  const { reply, sender, from, sock, msg } = contexto;

  // 1. Buscar combate activo
  const combat = await Combat.findOne({ jid: sender, groupId: from, isActive: true })
    .populate("playerPokemonId");
  
  if (!combat) return reply(aviso("No estás en ningún combate activo. Usa *!explorar* o *!pescar*."));

  const playerPoke = combat.playerPokemonId;
  const enemyPoke  = combat.enemy;

  let log = "";
  let pHP = combat.playerHP;
  let eHP = combat.enemy.hp_current;

  // 2. Determinar quién ataca primero basado en SPD
  const playerFirst = playerPoke.spd >= enemyPoke.spd;

  const playerTurn = async () => {
    const dano = calcularDano(playerPoke.atk, enemyPoke.def);
    eHP = Math.max(0, eHP - dano);
    log += `💥 *${playerPoke.nickname}* usó un ataque y causó \`${dano}\` de daño.\n`;
    if (eHP <= 0) log += `🌟 ¡El *${enemyPoke.name}* salvaje se ha debilitado!\n`;
  };

  const enemyTurn = async () => {
    if (eHP <= 0) return;
    const dano = calcularDano(enemyPoke.atk, playerPoke.def);
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

  // 3. Actualizar estado en DB
  if (eHP <= 0) {
    // Victoria
    const xpGain = 20 + Math.floor(Math.random() * 30);
    const goldGain = 50 + Math.floor(Math.random() * 100);
    
    await UserPokemon.findByIdAndUpdate(playerPoke._id, { $inc: { xp: xpGain } });
    await User.findOneAndUpdate({ jid: sender, groupId: from }, { $inc: { gold: goldGain } });
    
    combat.isActive = false;
    log += `\n✨ Has ganado \`${xpGain} XP\` y \`${goldGain} Oro\` 🪙`;
  } else if (pHP <= 0) {
    // Derrota
    combat.isActive = false;
  }

  combat.enemy.hp_current = eHP;
  combat.playerHP = pHP;
  combat.lastUpdate = Date.now();
  await combat.save();

  // 4. Renderizar nueva escena
  const buffer = await renderBattleScene(playerPoke, enemyPoke, pHP, eHP);

  return await sock.sendMessage(from, { 
    image: buffer, 
    caption: log 
  }, { quoted: msg });
};
