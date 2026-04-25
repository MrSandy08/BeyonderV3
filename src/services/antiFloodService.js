const messages = new Map(); 
 
class AntiFloodService { 
  static check(jid) { 
    const now = Date.now(); 
 
    if (!messages.has(jid)) { 
      messages.set(jid, []); 
    } 
 
    const userMsgs = messages.get(jid).filter(t => now - t < 5000); 
 
    userMsgs.push(now); 
    messages.set(jid, userMsgs); 
 
    return userMsgs.length > 5; 
  } 
} 
 
export default AntiFloodService; 
