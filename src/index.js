import { loadCommands } from "./core/commandHandler.js"; 
import "./modules/commands/index.js"; 
import "./modules/affinity/index.js"; 
import "./modules/activity/index.js"; 
import "./modules/moderation/index.js";
import "./modules/moderation/antiflood.js";
import { startScheduler } from "./core/scheduler.js"; 
 
export const initCore = async () => { 
  await loadCommands(); 
  startScheduler(); 
}; 
