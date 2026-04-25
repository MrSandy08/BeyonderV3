import fs from "fs"; 
import path from "path"; 
import { pathToFileURL } from "url";
import chokidar from "chokidar";

const commands = new Map(); 
const aliases = new Map();
let watcher = null;
 
export const loadCommands = async () => { 
  const basePath = path.resolve("./src/comandos"); 
 
  const walk = async (dir) => { 
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir); 
    for (const file of files) { 
      const full = path.join(dir, file); 
      if (fs.statSync(full).isDirectory()) await walk(full); 
      else if (file.endsWith(".js")) { 
        await loadCommandFile(full);
      } 
    } 
  }; 
 
  await walk(basePath); 
  startWatcher(basePath);
  console.log(`🚀 [v4] ${commands.size} comandos cargados.`);
}; 

const loadCommandFile = async (filePath) => {
  try {
    const cmdUrl = `${pathToFileURL(filePath).href}?update=${Date.now()}`;
    const cmd = await import(cmdUrl); 
    if (cmd.name) {
      commands.set(cmd.name, cmd); 
      cmd.aliases?.forEach(a => aliases.set(a, cmd)); 
    }
  } catch (err) {
    console.error(`Error cargando comando en ${filePath}:`, err);
  }
};

const startWatcher = (basePath) => {
  if (watcher) return;

  watcher = chokidar.watch(basePath, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    ignoreInitial: true
  });

  watcher.on("change", async (filePath) => {
    if (!filePath.endsWith(".js")) return;
    console.log(`🔄 [v4] Recargando comando: ${path.basename(filePath)}`);
    await loadCommandFile(filePath);
  });

  watcher.on("add", async (filePath) => {
    if (!filePath.endsWith(".js")) return;
    console.log(`🆕 [v4] Nuevo comando: ${path.basename(filePath)}`);
    await loadCommandFile(filePath);
  });
};
 
export const executeCommand = async (ctx) => { 
  const cmd = commands.get(ctx.command) || aliases.get(ctx.command); 
  if (!cmd) return; 
 
  try { 
    await cmd.run(ctx); 
  } catch (err) { 
    console.error(`Error comando ${ctx.command}:`, err); 
  } 
}; 
