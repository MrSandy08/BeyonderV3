import BanList from "../database/models/BanList.js"; 
 
class ModerationService { 
  static async ban(target, reason) { 
    await BanList.updateOne( 
      { jid: target }, 
      { reason }, 
      { upsert: true } 
    ); 
 
    return { ok: true, message: "Usuario baneado." }; 
  } 
 
  static async isBanned(jid) { 
    return await BanList.findOne({ jid }); 
  } 
} 
 
export default ModerationService; 
