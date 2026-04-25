import EconomyService from "./economyService.js"; 
import CooldownService from "./cooldownService.js"; 
 
class ExtortionService { 
  static async execute(sender, target, communityId) { 
    if (!target) { 
      return { ok: false, error: "Debes mencionar a alguien." }; 
    } 
 
    const cdKey = `extort:${sender}`; 
 
    if (CooldownService.isOnCooldown(cdKey)) { 
      return { ok: false, error: "⏳ Espera para extorsionar otra vez." }; 
    } 
 
    CooldownService.setCooldown(cdKey, 10 * 60 * 1000); 
 
    const success = Math.random() > 0.5; 
 
    if (!success) { 
      return { 
        ok: false, 
        error: "🚨 Fallaste y quedaste expuesto." 
      }; 
    } 
 
    const amount = Math.floor(Math.random() * 500) + 100; 
 
    try { 
      await EconomyService.removeMoney(target, communityId, amount); 
      await EconomyService.addMoney(sender, communityId, amount); 
    } catch { 
      return { 
        ok: false, 
        error: "El objetivo no tenía suficiente dinero." 
      }; 
    } 
 
    return { 
      ok: true, 
      message: `💸 Extorsionaste ${amount}` 
    }; 
  } 
} 
 
export default ExtortionService; 
