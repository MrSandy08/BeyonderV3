// src/handlers/commandHandler.js
import { readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

/**
 * Lee todas las subcarpetas de src/comandos/ y registra cada archivo .js en un Map.
 *
 * Nuevo contrato de cada archivo de comando:
 *   export const name       = "nombre";
 *   export const aliases    = ["alias1"];   // opcional
 *   export const onlyAdmin  = false;        // requiere ser admin de WA en el grupo
 *   export const onlyMod    = false;        // requiere admin WA + rango Mod en DB
 *   export const onlyOwner  = false;        // requiere rango Owner en DB
 *   export const run = async (contexto) => { ... };
 */
const cargarComandos = async () => {
  const comandos = new Map();
  const rutaBase = join(__dirname, "..", "comandos");

  let carpetas;
  try {
    carpetas = readdirSync(rutaBase, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  } catch {
    console.warn("⚠️  No se encontró src/comandos/ — el bot arrancará sin comandos.");
    return comandos;
  }

  for (const carpeta of carpetas) {
    const archivos = readdirSync(join(rutaBase, carpeta)).filter((f) => f.endsWith(".js"));

    for (const archivo of archivos) {
      const rutaArchivo = join(rutaBase, carpeta, archivo);

      let modulo;
      try {
        modulo = await import(pathToFileURL(rutaArchivo).href);
      } catch (err) {
        console.error(`❌ Error al importar ${archivo}:`, err.message);
        continue;
      }

      const run       = modulo.run;
      const aliases   = modulo.aliases   ?? [];
      const onlyAdmin = modulo.onlyAdmin ?? false;
      const onlyMod   = modulo.onlyMod   ?? false;
      const onlyOwner = modulo.onlyOwner ?? false;

      if (typeof run !== "function") {
        console.warn(`⚠️  [${carpeta}/${archivo}] no exporta una función run — omitido.`);
        continue;
      }

      const nombre = (modulo.name || archivo.replace(".js", "")).toLowerCase();
      const entry  = { run, onlyAdmin, onlyMod, onlyOwner, category: carpeta };

      comandos.set(nombre, entry);

      for (const alias of aliases) {
        if (comandos.has(alias.toLowerCase())) {
          console.warn(`⚠️  Alias "${alias}" ya está en uso — omitido.`);
          continue;
        }
        comandos.set(alias.toLowerCase(), entry);
      }

      const flags     = [onlyOwner && "owner", onlyMod && "mod", onlyAdmin && "admin"]
        .filter(Boolean).join("+") || "público";
      const aliasInfo = aliases.length ? ` (aliases: ${aliases.join(", ")})` : "";
      console.log(`   📦 [${carpeta}] !${nombre}${aliasInfo} → ${flags}`);
    }
  }

  // Caso especial: rpgEngine.js si existe en src/rpg/
  try {
    const rpgEnginePath = join(__dirname, "..", "rpg", "rpgEngine.js");
    if (existsSync(rpgEnginePath)) {
      const rpg = await import(pathToFileURL(rpgEnginePath).href);
      if (rpg.run) {
        const nombre = (rpg.name || "rpgEngine").toLowerCase();
        const entry = { 
          run: rpg.run, 
          onlyAdmin: rpg.onlyAdmin || false, 
          onlyMod: rpg.onlyMod || false, 
          onlyOwner: rpg.onlyOwner || false,
          category: "rpg"
        };
        comandos.set(nombre, entry);
        if (rpg.aliases) {
          rpg.aliases.forEach(a => comandos.set(a.toLowerCase(), entry));
        }
        console.log(`   📦 [rpg] !${nombre} (engine) → motor`);
      }
    }
  } catch (err) {
    // No interrumpir si no se encuentra
  }

  console.log(`\n✅ ${comandos.size} entrada(s) cargada(s) en el mapa de comandos.\n`);
  return comandos;
};

export default cargarComandos;