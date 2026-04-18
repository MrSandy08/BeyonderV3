// src/classes/PluginLoader.js
import fs from "fs";
import { join } from "path";
import { pathToFileURL } from "url";
import chokidar from "chokidar";

/**
 * Beyonder v4: Plugin & Command Loader
 * Permite cargar, recargar y gestionar comandos dinámicamente con Hot-Reload.
 */
class PluginLoader {
  constructor() {
    this.commands = new Map();
    this.aliases = new Map();
    this.pluginsPath = join(process.cwd(), "src/comandos");
    this.watcher = null;
  }

  /**
   * Carga todos los comandos y activa el Hot-Reload.
   */
  async loadAll() {
    this.commands.clear();
    this.aliases.clear();
    
    if (!fs.existsSync(this.pluginsPath)) {
      console.warn("⚠️  [v4] No se encontró src/comandos/ — el bot arrancará sin comandos.");
      return;
    }

    const categories = fs.readdirSync(this.pluginsPath);
    
    // Carga paralela de categorías para acelerar el arranque en HF Spaces
    await Promise.all(categories.map(async (category) => {
      const categoryPath = join(this.pluginsPath, category);
      if (!fs.statSync(categoryPath).isDirectory()) return;

      const files = fs.readdirSync(categoryPath).filter(f => f.endsWith(".js"));
      
      // Carga paralela de archivos dentro de cada categoría
      await Promise.all(files.map(file => this.loadCommand(category, file)));
    }));
    
    this.startWatcher();
    console.log(`🚀 [v4] ${this.commands.size} comandos cargados con Hot-Reload activo.`);
  }

  /**
   * Inicia el observador de archivos para recarga automática.
   */
  startWatcher() {
    if (this.watcher) return;

    this.watcher = chokidar.watch(this.pluginsPath, {
      ignored: /(^|[\/\\])\../, // ignora archivos ocultos
      persistent: true,
      ignoreInitial: true
    });

    this.watcher.on("change", async (path) => {
      if (!path.endsWith(".js")) return;
      
      const parts = path.split(/[\\/]/);
      const file = parts.pop();
      const category = parts.pop();
      
      console.log(`🔄 [v4] Detectado cambio en ${category}/${file}. Recargando...`);
      await this.loadCommand(category, file);
    });

    this.watcher.on("add", async (path) => {
      if (!path.endsWith(".js")) return;

      const parts = path.split(/[\\/]/);
      const file = parts.pop();
      const category = parts.pop();

      console.log(`🆕 [v4] Nuevo comando detectado: ${category}/${file}. Cargando...`);
      await this.loadCommand(category, file);
    });

    this.watcher.on("unlink", (path) => {
      const parts = path.split(/[\\/]/);
      const file = parts.pop();
      const name = file.replace(".js", "").toLowerCase();
      
      // Eliminar el comando y sus alias
      const cmd = this.commands.get(name);
      if (cmd && cmd.aliases) {
        cmd.aliases.forEach(alias => this.aliases.delete(alias.toLowerCase()));
      }
      this.commands.delete(name);
      console.log(`🗑️ [v4] Comando eliminado: ${name}`);
    });
  }

  /**
   * Carga un comando individual.
   */
  async loadCommand(category, file) {
    const filePath = join(this.pluginsPath, category, file);
    try {
      // Usar cache busting para permitir Hot-Reload (import dinámico con timestamp)
      const fileUrl = pathToFileURL(filePath).href + `?t=${Date.now()}`;
      const cmd = await import(fileUrl);

      const name = (cmd.name || file.replace(".js", "")).toLowerCase();

      const commandData = {
        ...cmd,
        name,
        category,
        file
      };

      if (typeof cmd.run !== "function") {
        console.warn(`⚠️ [v4] ${file} no exporta una función 'run'.`);
        return;
      }

      this.commands.set(name, commandData);

      if (cmd.aliases && Array.isArray(cmd.aliases)) {
        cmd.aliases.forEach(alias => {
          this.aliases.set(alias.toLowerCase(), name);
        });
      }
    } catch (e) {
      console.error(`❌ [v4] Error cargando comando ${file}:`, e.message);
    }
  }

  /**
   * Busca un comando por nombre o alias.
   */
  getCommand(name) {
    const cmdName = name.toLowerCase();
    const realName = this.aliases.get(cmdName) || cmdName;
    return this.commands.get(realName);
  }

  /**
   * Recarga un comando específico manualmente si es necesario.
   */
  async reloadCommand(name) {
    const cmd = this.getCommand(name);
    if (!cmd) return false;
    await this.loadCommand(cmd.category, cmd.file);
    return true;
  }
}

export default new PluginLoader();
