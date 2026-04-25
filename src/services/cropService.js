import User from "../database/models/User.js"; 
 
class CropService { 
  static async plant(jid, communityId) { 
    const user = await User.findOne({ jid, communityId }); 
 
    if (user.crop?.active) { 
      return { ok: false, error: "Ya tienes un cultivo activo." }; 
    } 
 
    user.crop = { 
      active: true, 
      plantedAt: Date.now() 
    }; 
 
    await user.save(); 
 
    return { ok: true, message: "🌱 Cultivo iniciado." }; 
  } 
 
  static async harvest(jid, communityId) { 
    const user = await User.findOne({ jid, communityId }); 
 
    if (!user.crop?.active) { 
      return { ok: false, error: "No tienes cultivo." }; 
    } 
 
    const elapsed = Date.now() - user.crop.plantedAt; 
 
    if (elapsed < 5 * 60 * 1000) { 
      return { ok: false, error: "⏳ Aún no está listo." }; 
    } 
 
    const reward = Math.floor(elapsed / 1000); 
 
    user.money += reward; 
    user.crop = null; 
 
    await user.save(); 
 
    return { 
      ok: true, 
      message: `🌾 Cosechaste ${reward}` 
    }; 
  } 
} 
 
export default CropService; 
