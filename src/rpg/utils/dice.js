// src/rpg/utils/dice.js
/**
 * Lanza un dado de 20 caras (D20) con modificadores.
 * 
 * @param {number} stat - El valor de la estadística del jugador.
 * @param {number} difficulty - La dificultad de la acción (CD).
 * @returns {Object} - Resultado con tipo de éxito y valor final.
 */
export const rollD20 = (stat = 0, difficulty = 10) => {
  const roll = Math.floor(Math.random() * 20) + 1;
  const total = roll + stat;

  let result = {
    roll,
    total,
    type: "fallo" // Default
  };

  if (roll === 20) {
    result.type = "critico";
  } else if (roll === 1) {
    result.type = "critico_negativo";
  } else if (total >= difficulty + 5) {
    result.type = "exito_critico"; // Éxito sobresaliente
  } else if (total >= difficulty) {
    result.type = "exito";
  } else if (total >= difficulty - 3) {
    result.type = "exito_parcial";
  } else {
    result.type = "fallo";
  }

  return result;
};

/**
 * Lanza un dado genérico de N caras.
 * @param {number} faces 
 * @returns {number}
 */
export const rollDice = (faces) => Math.floor(Math.random() * faces) + 1;
