import fs from "fs"; 
import path from "path"; 
import { pathToFileURL } from "url";
import chokidar from "chokidar";
import config from "../config.js";
import User from "../classes/User.js";

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

const checkPermissions = async (cmd, ctx) => {
  console.log("🔍 [PERMISOS] Verificando permisos para:", ctx.sender);
  console.log("🔍 [PERMISOS] Comando:", cmd.name);
  console.log("🔍 [PERMISOS] onlyOwner:", cmd.onlyOwner);
  console.log("🔍 [PERMISOS] onlyMod:", cmd.onlyMod);
  console.log("🔍 [PERMISOS] onlyAdmin:", cmd.onlyAdmin);
  console.log("🔍 [PERMISOS] config.OWNERS:", config.OWNERS);
  console.log("🔍 [PERMISOS] ctx.communityId:", ctx.communityId);
  
  const isOwner = config.OWNERS.includes(ctx.sender);
  console.log("🔍 [PERMISOS] isOwner (config):", isOwner);
  
  if (cmd.onlyOwner && !isOwner) {
    const dbUser = await User.get(ctx.sender, ctx.communityId);
    console.log("🔍 [PERMISOS] dbUser (onlyOwner):", dbUser?.data);
    if (!dbUser || !dbUser.isOwner(config.OWNERS)) {
      console.log("❌ [PERMISOS] No es owner");
      return false;
    }
  }
  
  if (cmd.onlyMod) {
    const dbUser = await User.get(ctx.sender, ctx.communityId);
    console.log("🔍 [PERMISOS] dbUser (onlyMod):", dbUser?.data);
    if (!dbUser || !dbUser.isMod()) {
      const isOwnerCheck = config.OWNERS.includes(ctx.sender) || (dbUser && dbUser.isOwner(config.OWNERS));
      console.log("🔍 [PERMISOS] isOwnerCheck (onlyMod):", isOwnerCheck);
      if (!isOwnerCheck) {
        console.log("❌ [PERMISOS] No es mod ni owner");
        return false;
      }
    }
  }
  
  if (cmd.onlyAdmin) {
    const dbUser = await User.get(ctx.sender, ctx.communityId);
    console.log("🔍 [PERMISOS] dbUser (onlyAdmin):", dbUser?.data);
    if (!dbUser || !dbUser.isHelper()) {
      const isOwnerCheck = config.OWNERS.includes(ctx.sender) || (dbUser && dbUser.isOwner(config.OWNERS));
      const isModCheck = dbUser && dbUser.isMod();
      console.log("🔍 [PERMISOS] isOwnerCheck (onlyAdmin):", isOwnerCheck);
      console.log("🔍 [PERMISOS] isModCheck (onlyAdmin):", isModCheck);
      if (!isOwnerCheck && !isModCheck) {
        console.log("❌ [PERMISOS] No es admin, mod ni owner");
        return false;
      }
    }
  }
  
  console.log("✅ [PERMISOS] Permisos concedidos!");
  return true;
};
 
export const executeCommand = async (ctx) => { 
  const cmd = commands.get(ctx.command) || aliases.get(ctx.command); 
  if (!cmd) return; 
 
  try { 
    const hasPermission = await checkPermissions(cmd, ctx);
    if (!hasPermission) {
      return ctx.reply("❌ No tienes permisos para usar este comando.");
    }
    await cmd.run(ctx); 
  } catch (err) { 
    console.error(`Error comando ${ctx.command}:`, err); 
  } 
}; 
