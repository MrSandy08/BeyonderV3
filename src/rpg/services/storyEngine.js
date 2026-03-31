// src/rpg/services/storyEngine.js
import Player from "../models/Player.js";
import GroupRPG from "../models/GroupRPG.js";

/**
 * Inicia una nueva aventura para el grupo.
 * @param {string} groupId 
 * @returns {Promise<Object>}
 */
export const startAdventure = async (groupId) => {
  let group = await GroupRPG.findOne({ groupId });
  if (!group) {
    group = await GroupRPG.create({ 
      groupId,
      currentScene: "prologo",
      location: "Pueblo Inicial"
    });
  } else {
    group.currentScene = "prologo";
    group.location = "Pueblo Inicial";
    await group.save();
  }
  return group;
};

/**
 * Obtiene la escena actual basada en el estado del grupo.
 * @param {string} groupId 
 * @returns {Promise<string>}
 */
export const getScene = async (groupId) => {
  const group = await GroupRPG.findOne({ groupId });
  if (!group) return "❌ Aventura no iniciada en este grupo. Usa !adventure";

  // Lógica de narrativa persistente
  const scenes = {
    "prologo": "📜 Te encuentras en las puertas del *Pueblo Inicial*. El aire huele a aventura y a pan recién horneado. Una vieja carreta bloquea el camino principal.",
    "camino_bosque": "🌲 El camino se interna en un bosque denso. Escuchas ruidos extraños entre los arbustos. ¿Deseas investigar o seguir adelante?",
    "combate_inicial": "⚔️ ¡Un goblin salvaje aparece de la nada con intenciones hostiles!"
  };

  return scenes[group.currentScene] || "Desconocido...";
};

/**
 * Resuelve una decisión narrativa.
 * @param {string} groupId 
 * @param {string} choice 
 */
export const resolveChoice = async (groupId, choice) => {
  const group = await GroupRPG.findOne({ groupId });
  if (!group) return;

  // Lógica de transiciones de escenas (Ejemplo simple)
  if (group.currentScene === "prologo" && choice === "investigar") {
    group.currentScene = "camino_bosque";
  } else if (group.currentScene === "camino_bosque" && choice === "investigar") {
    group.currentScene = "combate_inicial";
    // Podríamos disparar un spawnEncounter aquí
  }
  
  await group.save();
  return getScene(groupId);
};

/**
 * Spawnea un encuentro de combate.
 * @param {string} groupId 
 */
export const spawnEncounter = async (groupId) => {
  const group = await GroupRPG.findOne({ groupId });
  if (!group) return;

  const enemy = {
    name: "Goblin Asaltante",
    hp: 30,
    maxHp: 30,
    attack: 5,
    defense: 2,
    xpReward: 20,
    goldReward: 15
  };

  group.activeEnemies.push(enemy);
  await group.save();
  return enemy;
};
