import EconomyService from "./economyService.js"; 
import CooldownService from "./cooldownService.js"; 
 
class CrimeService { 
  static async commit(jid, communityId) { 
    const cdKey = `crime:${jid}`; 
 
    if (CooldownService.isOnCooldown(cdKey)) { 
      return { 
        ok: false, 
        error: "⏳ Debes esperar antes de cometer otro crimen." 
      }; 
    } 
 
    CooldownService.setCooldown(cdKey, 5 * 60 * 1000); 
 
    const success = Math.random() > 0.4; 
 
    if (!success) { 
      const fine = Math.floor(Math.random() * 300) + 100; 
 
      try { 
        await EconomyService.removeMoney(jid, communityId, fine); 
      } catch { 
        return { 
          ok: false, 
          error: "💀 Fallaste el crimen y no tenías dinero." 
        }; 
      } 
 
      return { 
        ok: false, 
        error: `🚓 Fallaste el crimen. Multa: ${fine}` 
      }; 
    } 
 
    const reward = Math.floor(Math.random() * 800) + 200; 
 
    await EconomyService.addMoney(jid, communityId, reward); 
 
    return { 
      ok: true, 
      message: `💰 Crimen exitoso. Ganaste ${reward}` 
    }; 
  } 
} 
 
export default CrimeService; 
