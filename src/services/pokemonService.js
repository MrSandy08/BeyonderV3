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
 */
export const getPokemonSprite = async (id) => {
  const filePath = join(CACHE_DIR, `${id}.png`);
  
  try {
    // Verificar si ya existe en caché
    await fs.access(filePath);
    return filePath;
  } catch {
    // Si no existe, descargar
    const url = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
    try {
      const response = await axios.get(url, { responseType: "arraybuffer" });
      await fs.writeFile(filePath, Buffer.from(response.data));
      return filePath;
    } catch (err) {
      console.error(`Error descargando sprite de Pokémon ${id}:`, err.message);
      return null;
    }
  }
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
