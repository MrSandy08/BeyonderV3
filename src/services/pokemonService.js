import axios from "axios";
import { createCanvas, loadImage } from "canvas";
import { promises as fs } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const CACHE_DIR  = join(__dirname, "..", "..", "cache", "pokemon");

// Asegurar que existe la carpeta de caché
const initCache = async () => {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch (err) {
    console.error("Error creando caché de pokemon:", err);
  }
};
initCache();

const TYPE_COLORS = {
  normal:   "#A8A878", fire:     "#F08030", water:    "#6890F0",
  electric: "#F8D030", grass:    "#78C850", ice:      "#98D8D8",
  fighting: "#C03028", poison:   "#A040A0", ground:   "#E0C068",
  flying:   "#A890F0", psychic:  "#F85888", bug:      "#A8B820",
  rock:     "#B8A038", ghost:    "#705898", dragon:   "#7038F8",
  dark:     "#705848", steel:    "#B8B8D0", fairy:    "#EE99AC"
};

const TYPE_COLORS_DARK = {
  normal:   "#6D6D4E", fire:     "#9C531F", water:    "#445E9C",
  electric: "#A1871F", grass:    "#4E8235", ice:      "#638D8D",
  fighting: "#7D1F1A", poison:   "#682A68", ground:   "#927D44",
  flying:   "#6D5E9C", psychic:  "#A13959", bug:      "#6D7815",
  rock:     "#786824", ghost:    "#493963", dragon:   "#4924A1",
  dark:     "#49392F", steel:    "#787887", fairy:    "#9B6470"
};

/**
 * Obtiene los datos base de un Pokémon desde PokeAPI
 */
export const getPokemonData = async (idOrName) => {
  try {
    const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${idOrName.toString().toLowerCase()}`);
    const data = response.data;
    
    return {
      id:     data.id,
      name:   data.name,
      types:  data.types.map(t => t.type.name),
      stats: {
        hp:  data.stats.find(s => s.stat.name === "hp").base_stat,
        atk: data.stats.find(s => s.stat.name === "attack").base_stat,
        def: data.stats.find(s => s.stat.name === "defense").base_stat,
        spd: data.stats.find(s => s.stat.name === "speed").base_stat,
      },
      spriteUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${data.id}.png`
    };
  } catch (err) {
    console.error(`Error obteniendo data de Pokémon ${idOrName}:`, err.message);
    return null;
  }
};

/**
 * Descarga y guarda el sprite en caché si no existe
 * @param {number} id - ID del Pokémon
 * @param {string} type - "front" o "back"
 */
export const getPokemonSprite = async (id, type = "front") => {
  const fileName = `${id}_${type}.png`;
  const filePath = join(CACHE_DIR, fileName);
  
  try {
    await fs.access(filePath);
    return filePath;
  } catch {
    const url = type === "back" 
      ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${id}.png`
      : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
    
    try {
      const response = await axios.get(url, { responseType: "arraybuffer" });
      await fs.writeFile(filePath, Buffer.from(response.data));
      return filePath;
    } catch (err) {
      console.error(`Error descargando sprite ${type} de Pokémon ${id}:`, err.message);
      return null;
    }
  }
};

/**
 * Genera una escena de batalla estilo GBA con menús integrados
 */
export const renderBattleScene = async (playerPoke, enemyPoke, playerHP, enemyHP, menuType = "main", moveData = []) => {
  const canvas = createCanvas(480, 320);
  const ctx = canvas.getContext("2d");

  // 1. Fondo
  const grad = ctx.createLinearGradient(0, 0, 0, 320);
  grad.addColorStop(0, "#87CEEB");
  grad.addColorStop(0.6, "#90EE90");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 480, 240); // Espacio para el menú abajo

  // 2. Plataformas
  ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
  ctx.beginPath(); ctx.ellipse(350, 100, 80, 30, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(120, 210, 100, 40, 0, 0, Math.PI * 2); ctx.fill();

  // 3. Sprites
  const enemySprite = await getPokemonSprite(enemyPoke.pokeID, "front");
  const playerSprite = await getPokemonSprite(playerPoke.pokeID, "back");
  if (enemySprite) ctx.drawImage(await loadImage(enemySprite), 300, 20, 100, 100);
  if (playerSprite) ctx.drawImage(await loadImage(playerSprite), 50, 100, 140, 140);

  // 4. Interfaz de HP
  const drawHPBar = (x, y, name, level, current, max) => {
    ctx.fillStyle = "white"; ctx.strokeStyle = "black"; ctx.lineWidth = 2;
    ctx.fillRect(x, y, 160, 45); ctx.strokeRect(x, y, 160, 45);
    ctx.fillStyle = "black"; ctx.font = "bold 12px sans-serif";
    ctx.fillText(name.toUpperCase(), x + 8, y + 15);
    ctx.fillText(`Lv${level}`, x + 120, y + 15);
    ctx.fillStyle = "#444"; ctx.fillRect(x + 8, y + 22, 144, 8);
    const percent = Math.max(0, Math.min(1, current / max));
    ctx.fillStyle = percent > 0.5 ? "#4fc337" : (percent > 0.2 ? "#ffd633" : "#ff4d4d");
    ctx.fillRect(x + 8, y + 22, 144 * percent, 8);
    ctx.font = "10px sans-serif"; ctx.fillText(`${current}/${max}`, x + 115, y + 40);
  };
  drawHPBar(20, 20, enemyPoke.name, enemyPoke.level, enemyHP, enemyPoke.hp_max);
  drawHPBar(300, 160, playerPoke.nickname, playerPoke.level, playerHP, playerPoke.hp_max);

  // 5. Menú Inferior (240-320px)
  ctx.fillStyle = "#333"; ctx.fillRect(0, 240, 480, 80);
  ctx.strokeStyle = "white"; ctx.lineWidth = 3; ctx.strokeRect(5, 245, 470, 70);

  if (menuType === "main") {
    const options = ["FIGHT", "BAG", "PKMN", "RUN"];
    ctx.font = "bold 18px sans-serif";
    options.forEach((opt, i) => {
      const x = 50 + (i % 2) * 200;
      const y = 275 + Math.floor(i / 2) * 25;
      ctx.fillStyle = "white";
      ctx.fillText(opt, x, y);
    });
    ctx.font = "14px sans-serif";
    ctx.fillText("¿Qué debería hacer?", 280, 275);
    ctx.fillText(`${playerPoke.nickname.toUpperCase()}?`, 280, 295);
  } else if (menuType === "fight") {
    // Cuadrícula 2x2 de ataques
    ctx.font = "bold 14px sans-serif";
    for (let i = 0; i < 4; i++) {
      const moveName = playerPoke.moves[i] || "-";
      const info = moveData.find(m => m.name === moveName) || { type: "normal", pp: 15, max_pp: 15 };
      const x = 20 + (i % 2) * 220;
      const y = 270 + Math.floor(i / 2) * 30;
      
      // Fondo del tipo
      ctx.fillStyle = TYPE_COLORS_DARK[info.type.toLowerCase()] || "#666";
      ctx.fillRect(x, y - 15, 200, 25);
      
      ctx.fillStyle = "white";
      ctx.fillText(`${i + 1}. ${moveName}`, x + 10, y + 2);
      ctx.font = "10px sans-serif";
      ctx.fillText(`PP: ${info.pp || 15}/${info.max_pp || 15}`, x + 150, y + 2);
      ctx.font = "bold 14px sans-serif";
    }
  }

  return canvas.toBuffer("image/png");
};

/**
 * Genera una interfaz visual para la tienda o inventario
 */
export const renderInventoryUI = async (title, gold, items) => {
  const canvas = createCanvas(480, 400);
  const ctx = canvas.getContext("2d");

  // Fondo elegante
  ctx.fillStyle = "#2c3e50";
  ctx.fillRect(0, 0, 480, 400);
  
  // Título
  ctx.fillStyle = "#ecf0f1";
  ctx.font = "bold 24px sans-serif";
  ctx.fillText(title.toUpperCase(), 20, 40);

  // Saldo de Oro
  ctx.fillStyle = "#f1c40f";
  ctx.font = "bold 18px sans-serif";
  ctx.fillText(`💰 ${gold} Oro`, 350, 40);

  // Lista de items
  let y = 80;
  for (const item of items) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    ctx.fillRect(10, y, 460, 50);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.strokeRect(10, y, 460, 50);

    // Icono (Simulado con un círculo si no hay assets reales todavía)
    ctx.fillStyle = item.color || "#95a5a6";
    ctx.beginPath(); ctx.arc(40, y + 25, 15, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = "white";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText(item.name, 70, y + 30);
    
    ctx.font = "14px sans-serif";
    ctx.fillText(`x${item.qty}`, 400, y + 30);
    
    if (item.price) {
      ctx.fillStyle = "#f1c40f";
      ctx.fillText(`${item.price} G`, 320, y + 30);
    }

    y += 60;
  }

  return canvas.toBuffer("image/png");
};

/**
 * Genera una escena de exploración (Minería/Pesca)
 */
export const renderExplorationScene = async (type, itemName = null, isSuccess = false) => {
  const canvas = createCanvas(480, 320);
  const ctx = canvas.getContext("2d");

  // Fondo según tipo
  if (type === "mining") {
    ctx.fillStyle = "#34495e"; // Cueva
    ctx.fillRect(0, 0, 480, 320);
    // Dibujar algunas rocas
    ctx.fillStyle = "#2c3e50";
    for(let i=0; i<10; i++) ctx.fillRect(Math.random()*480, Math.random()*320, 40, 40);
  } else {
    ctx.fillStyle = "#3498db"; // Agua
    ctx.fillRect(0, 0, 480, 320);
    // Dibujar ondas
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    for(let i=0; i<5; i++) {
      ctx.beginPath(); ctx.arc(240, 160, 20 + i*30, 0, Math.PI*2); ctx.stroke();
    }
  }

  if (isSuccess && itemName) {
    // Efecto de destello
    const grad = ctx.createRadialGradient(240, 160, 10, 240, 160, 100);
    grad.addColorStop(0, "rgba(255, 255, 255, 0.8)");
    grad.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(240, 160, 100, 0, Math.PI*2); ctx.fill();

    // Objeto flotando
    ctx.fillStyle = "white";
    ctx.font = "bold 24px sans-serif";
    const text = `¡Encontraste ${itemName}!`;
    ctx.fillText(text, 240 - ctx.measureText(text).width/2, 160);
  } else if (!isSuccess) {
    ctx.fillStyle = "white";
    ctx.font = "bold 20px sans-serif";
    const text = type === "mining" ? "Minando..." : "Lanzando la caña...";
    ctx.fillText(text, 240 - ctx.measureText(text).width/2, 160);
  }

  return canvas.toBuffer("image/png");
};



/**
 * Genera una ficha visual del Pokémon con fondo circular
 */
export const renderPokemonCard = async (pokeData) => {
  const canvas = createCanvas(400, 400);
  const ctx = canvas.getContext("2d");

  // 1. Fondo (color basado en el primer tipo)
  const mainType = pokeData.types[0];
  const color = TYPE_COLORS[mainType] || "#FFFFFF";

  // Círculo de fondo
  ctx.beginPath();
  ctx.arc(200, 200, 180, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  
  // Borde blanco
  ctx.lineWidth = 10;
  ctx.strokeStyle = "#FFFFFF";
  ctx.stroke();

  // 2. Sprite del Pokémon
  const spritePath = await getPokemonSprite(pokeData.id);
  if (spritePath) {
    const image = await loadImage(spritePath);
    // Dibujar escalado (los sprites suelen ser 96x96, los escalamos a 300x300)
    ctx.drawImage(image, 50, 50, 300, 300);
  }

  return canvas.toBuffer("image/png");
};
