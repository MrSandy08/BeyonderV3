import eventBus from "../../core/eventBus.js"; 
import CommunityService from "../../services/communityService.js"; 
import UserClass from "../../classes/User.js";
 
eventBus.on("activity", async (ctx) => { 
  // 1. Registrar actividad del grupo
  await CommunityService.registerActivity(ctx.from); 

  // 2. Registrar actividad del usuario (msgCount, etc)
  const user = await UserClass.findOrCreate(ctx.sender, ctx.communityId, {
    nombre: ctx.senderName,
    groupId: ctx.from
  });

  if (user) {
    await user.incrementMsgCount();
  }
}); 
