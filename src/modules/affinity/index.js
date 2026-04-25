import eventBus from "../../core/eventBus.js"; 
import AffinityService from "../../services/affinityService.js"; 
 
eventBus.on("message_received", async (ctx) => { 
  await AffinityService.add(ctx.sender, ctx.from, 1); 
}); 
 
eventBus.on("command_executed", async (ctx) => { 
  await AffinityService.add(ctx.sender, ctx.from, 2); 
}); 
