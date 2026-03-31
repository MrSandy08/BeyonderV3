// src/rpg/services/renderEngine.js
import { createCanvas, loadImage } from "canvas";
import { join } from "path";

/**
 * Renderiza la mochila (inventario visual) del jugador.
 * @param {Object} player - Datos del jugador.
 * @returns {Buffer}
 */
export const renderInventory = async (player) => {
  const canvas = createCanvas(800, 600);
  const ctx = canvas.getContext("2d");

  // 1. Cargar imagen base obligatoria
  const baseImgPath = join(process.cwd(), "assets", "mochila_base.png");
  const baseImg = await loadImage(baseImgPath);
  ctx.drawImage(baseImg, 0, 0, 800, 600);

  // Configuración de texto
  ctx.fillStyle = "#FFFFFF";
  ctx.font = '24px "Medieval"';

  // 2. Renderizar Header
  ctx.fillText(player.name.toUpperCase(), 50, 50);
  ctx.fillText(`LVL: ${player.level}`, 400, 50);
  ctx.fillText(`XP: ${player.xp}`, 550, 50);
  ctx.fillText(`HP: ${player.hp}/${player.maxHp}`, 50, 90);
  ctx.fillText(`ORO: ${player.gold}`, 400, 90);
  ctx.fillText(`PESO: ${calculateWeight(player.inventory)}kg`, 550, 90);

  // 3. Renderizar Columna Izquierda (Stats)
  ctx.font = '18px "Medieval"';
  ctx.fillText(`STR: ${player.stats.strength}`, 50, 160);
  ctx.fillText(`DEX: ${player.stats.dexterity}`, 50, 200);
  ctx.fillText(`INT: ${player.stats.intelligence}`, 50, 240);
  ctx.fillText(`CHA: ${player.stats.charisma}`, 50, 280);
  
  ctx.fillText(`ARMA: ${player.equipment.weapon?.name || "Desarmado"}`, 50, 340);
  ctx.fillText(`ARMADURA: ${player.equipment.armor?.name || "Sin Armadura"}`, 50, 380);

  // 4. Renderizar Columna Derecha (Inventario)
  const inv = player.inventory || [];
  inv.forEach((item, i) => {
    if (i < 10) { // Límite visual por página
      ctx.fillText(`${i + 1}. ${item.name} (${item.weight}kg)`, 350, 160 + (i * 35));
    }
  });

  // 5. Renderizar Footer
  ctx.font = '16px "Medieval"';
  ctx.fillText("Comandos: !use [item] | !equip [item] | !drop [item]", 50, 550);

  return canvas.toBuffer("image/png");
};

/**
 * Renderiza el perfil completo del jugador.
 * @param {Object} player 
 * @returns {Buffer}
 */
export const renderProfile = async (player) => {
  const canvas = createCanvas(600, 400);
  const ctx = canvas.getContext("2d");

  const baseImgPath = join(process.cwd(), "assets", "profile_base.png");
  const baseImg = await loadImage(baseImgPath);
  ctx.drawImage(baseImg, 0, 0, 600, 400);

  ctx.fillStyle = "#FFD700";
  ctx.font = '32px "Medieval"';
  ctx.fillText(player.name, 100, 80);
  
  ctx.fillStyle = "#FFFFFF";
  ctx.font = '22px "Medieval"';
  ctx.fillText(`Clase: ${player.class}`, 100, 130);
  ctx.fillText(`Nivel: ${player.level}`, 100, 170);
  ctx.fillText(`HP: ${player.hp}/${player.maxHp}`, 100, 210);
  ctx.fillText(`Oro: ${player.gold}`, 100, 250);

  return canvas.toBuffer("image/png");
};

// Helper para calcular peso
const calculateWeight = (inventory) => {
  return inventory.reduce((sum, item) => sum + (item.weight || 0), 0);
};
