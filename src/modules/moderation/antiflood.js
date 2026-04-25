import eventBus from "../../core/eventBus.js"; 
import AntiFloodService from "../../services/antiFloodService.js"; 
 
eventBus.on("message_received", async (ctx) => { 
  const flood = AntiFloodService.check(ctx.sender); 
 
  if (flood) { 
    await ctx.reply("🚨 Spam detectado."); 
  } 
}); 
