import eventBus from "../../core/eventBus.js"; 
import ModerationService from "../../services/moderationService.js"; 
 
eventBus.on("message_received", async (ctx) => { 
  const banned = await ModerationService.isBanned(ctx.sender); 
  if (banned) { 
    return; // ignora completamente 
  } 
}); 
