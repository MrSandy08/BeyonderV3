import User from "../database/models/User.js"; 
 
class EconomyService { 
  static async getUser(jid, communityId) { 
    return await User.findOne({ jid, communityId }); 
  } 
 
  static async addMoney(jid, communityId, amount) { 
    return await User.updateOne( 
      { jid, communityId }, 
      { $inc: { money: amount } } 
    ); 
  } 
 
  static async removeMoney(jid, communityId, amount) { 
    const user = await this.getUser(jid, communityId); 
    if (!user || user.money < amount) { 
      throw new Error("Fondos insuficientes"); 
    } 
 
    return await User.updateOne( 
      { jid, communityId }, 
      { $inc: { money: -amount } } 
    ); 
  } 
 
  static async hunt(jid, communityId) { 
    const user = await this.getUser(jid, communityId); 
    if (!user) return { message: "Usuario no encontrado." }; 
 
    const reward = Math.floor(Math.random() * 500) + 100; 
 
    user.money += reward; 
    await user.save(); 
 
    return { 
      message: `🏹 Cazaste y ganaste ${reward} monedas. Total: ${user.money}` 
    }; 
  } 
} 
 
export default EconomyService; 
