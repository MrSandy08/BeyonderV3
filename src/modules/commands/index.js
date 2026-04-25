import eventBus from "../../core/eventBus.js"; 
import { executeCommand } from "../../core/commandHandler.js"; 
 
eventBus.on("command_executed", async (ctx) => { 
  await executeCommand(ctx); 
}); 
