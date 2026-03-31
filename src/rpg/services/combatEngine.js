// src/rpg/services/combatEngine.js
import Player from "../models/Player.js";
import GroupRPG from "../models/GroupRPG.js";
import { rollD20, rollDice } from "../utils/dice.js";

/**
 * Lanza un ataque contra un objetivo.
 * @param {string} userId - ID del atacante.
 * @param {string} groupId - ID del grupo.
 * @param {string} targetId - ID del objetivo (User o Enemy).
 * @returns {Promise<Object>} - El resultado del combate.
 */
export const attackTarget = async (userId, groupId, targetId = null) => {
  const player = await Player.findOne({ userId, groupId });
  if (!player) return { error: "❌ Jugador no registrado. Usa !adventure" };

  const group = await GroupRPG.findOne({ groupId });
  if (!group) return { error: "❌ Aventura no iniciada." };

  // Prioridad 1: Enemigo activo en el grupo
  const enemy = group.activeEnemies[0];
  if (!enemy) return { error: "❌ No hay enemigos cercanos. ¿Deseas viajar?" };

  // Cálculo de Daño Base
  const baseDamage = player.stats.strength + (player.equipment.weapon?.stats?.attack || 0);
  const roll = rollD20(player.stats.strength, 12); // CD 12 para acertar

  let damageDealt = 0;
  let message = "";

  if (roll.type === "critico") {
    damageDealt = Math.floor(baseDamage * 1.5) + rollDice(6);
    message = `🔥 ¡CRÍTICO! Has asestado un golpe demoledor a *${enemy.name}*.`;
  } else if (roll.type === "exito" || roll.type === "exito_parcial") {
    damageDealt = baseDamage + rollDice(4);
    message = `⚔️ Has golpeado a *${enemy.name}*.`;
  } else if (roll.type === "critico_negativo") {
    damageDealt = 0;
    message = `💨 ¡Pifia! Tu arma se ha resbalado y has fallado estrepitosamente.`;
  } else {
    damageDealt = 0;
    message = `🛡️ Has fallado el ataque contra *${enemy.name}*.`;
  }

  // Aplicar Daño al Enemigo
  enemy.hp -= damageDealt;
  message += `\n       𝄄   💥 Daño infligido: *${damageDealt}*`;

  // Verificar Muerte del Enemigo
  if (enemy.hp <= 0) {
    message += `\n       𝄄   💀 *${enemy.name}* ha sido derrotado.`;
    player.xp += enemy.xpReward;
    player.gold += enemy.goldReward;
    group.activeEnemies.shift(); // Eliminar primer enemigo
  }

  await player.save();
  await group.save();

  return { message, player, enemy: group.activeEnemies[0] || null };
};

/**
 * Inicia un duelo PvP entre dos jugadores.
 * @param {string} userId - Atacante.
 * @param {string} targetId - Objetivo (mencionado).
 * @param {string} groupId - ID del grupo.
 */
export const startDuel = async (userId, targetId, groupId) => {
  const p1 = await Player.findOne({ userId, groupId });
  const p2 = await Player.findOne({ userId: targetId, groupId });

  if (!p1 || !p2) return { error: "❌ Ambos duelistas deben tener un perfil activo." };

  // Guardar estado de combate
  p2.combatState = {
    inDuel: true,
    challenger: userId,
    bet: Math.floor(p2.gold * 0.1) // 10% del oro como apuesta
  };

  await p2.save();
  return { message: `⚔️ @${userId.split("@")[0]} ha retado a un duelo a @${targetId.split("@")[0]}. Usa !accept para comenzar.` };
};

/**
 * Resuelve un turno de duelo.
 */
export const resolveDuelTurn = async (p1, p2) => {
  // Lógica de turnos PvP...
};
