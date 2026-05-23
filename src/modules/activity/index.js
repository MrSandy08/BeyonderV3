import eventBus from "../../core/eventBus.js"; 
import CommunityService from "../../services/communityService.js"; 
import UserClass from "../../classes/User.js";
import User from "../../database/models/User.js";

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
  
  // 3. Registrar mensajes para SUA-Bot
  const dbUser = await User.findOne({ jid: ctx.sender, communityId: ctx.communityId });
  if (dbUser) {
    dbUser.mensajes = (dbUser.mensajes || 0) + 1;
    dbUser.lastSeen = new Date();
    await dbUser.save();
    
    // Update user in cache
    const cachedUser = await UserClass.get(ctx.sender, ctx.communityId);
    if (cachedUser) {
      cachedUser.data.mensajes = dbUser.mensajes;
      cachedUser.data.lastSeen = dbUser.lastSeen;
      await cachedUser.saveToCache();
    }
  }
}); 
