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
 * Genera una escena de batalla estilo GBA
 */
export const renderBattleScene = async (playerPoke, enemyPoke, playerHP, enemyHP) => {
  const canvas = createCanvas(480, 320);
  const ctx = canvas.getContext("2d");

  // 1. Fondo (Verde simple si no hay assets, o gradiente)
  const grad = ctx.createLinearGradient(0, 0, 0, 320);
  grad.addColorStop(0, "#87CEEB"); // Cielo
  grad.addColorStop(0.6, "#90EE90"); // Suelo
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 480, 320);

  // Plataformas (Elipses)
  ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
  // Enemigo (arriba derecha)
  ctx.beginPath();
  ctx.ellipse(350, 100, 80, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  // Jugador (abajo izquierda)
  ctx.beginPath();
  ctx.ellipse(120, 240, 100, 40, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Sprites
  const enemySprite = await getPokemonSprite(enemyPoke.pokeID, "front");
  const playerSprite = await getPokemonSprite(playerPoke.pokeID, "back");

  if (enemySprite) {
    const img = await loadImage(enemySprite);
    ctx.drawImage(img, 300, 20, 100, 100);
  }
  if (playerSprite) {
    const img = await loadImage(playerSprite);
    ctx.drawImage(img, 50, 120, 160, 160);
  }

  // 3. Interfaz de HP
  const drawHPBar = (x, y, name, level, current, max, isPlayer) => {
    // Caja de info
    ctx.fillStyle = "white";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, 180, 60);
    ctx.strokeRect(x, y, 180, 60);

    // Texto
    ctx.fillStyle = "black";
    ctx.font = "bold 16px sans-serif"; // Usar sans-serif si no hay fuente pixel registrada
    ctx.fillText(`${name.toUpperCase()}`, x + 10, y + 25);
    ctx.fillText(`Lv${level}`, x + 130, y + 25);

    // Barra de HP (Fondo)
    ctx.fillStyle = "#444";
    ctx.fillRect(x + 10, y + 35, 160, 12);

    // Barra de HP (Vida)
    const percent = Math.max(0, current / max);
    let color = "#4fc337"; // Verde
    if (percent < 0.2) color = "#ff4d4d"; // Rojo
    else if (percent < 0.5) color = "#ffd633"; // Amarillo

    ctx.fillStyle = color;
    ctx.fillRect(x + 10, y + 35, 160 * percent, 12);
    
    // Texto de vida (solo jugador)
    if (isPlayer) {
      ctx.fillStyle = "black";
      ctx.font = "12px sans-serif";
      ctx.fillText(`${current}/${max}`, x + 120, y + 55);
    }
  };

  // Dibujar barras (Enemigo arriba izquierda, Jugador abajo derecha)
  drawHPBar(20, 20, enemyPoke.name, enemyPoke.level, enemyHP, enemyPoke.hp_max, false);
  drawHPBar(280, 230, playerPoke.nickname, playerPoke.level, playerHP, playerPoke.hp_max, true);

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
