import eventBus from "../../core/eventBus.js"; 
import { getAiResponse } from "../../services/iaService.js"; 
 
eventBus.on("message_received", async (ctx) => { 
  if (!ctx.body || ctx.isCommand) return; 
 
  // probabilidad baja para no spam 
  if (Math.random() > 0.1) return; 
 
  const res = await getAiResponse( 
    ctx.sender, 
    ctx.from, 
    ctx.communityId,
    ctx.senderName,
    ctx.body,
    [], // history
    false, // forced
    ctx.mentionedJids
  ); 
 
  if (res?.text) { 
    await ctx.reply(res.text); 
  } 
}); 
