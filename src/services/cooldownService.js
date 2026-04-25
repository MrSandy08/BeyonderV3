const cooldowns = new Map(); 
 
class CooldownService { 
  static isOnCooldown(key) { 
    const now = Date.now(); 
    const data = cooldowns.get(key); 
 
    if (!data) return false; 
 
    return now < data; 
  } 
 
  static setCooldown(key, ms) { 
    cooldowns.set(key, Date.now() + ms); 
  } 
 
  static getRemaining(key) { 
    const now = Date.now(); 
    const time = cooldowns.get(key) || 0; 
    return Math.max(0, time - now); 
  } 
} 
 
export default CooldownService; 
