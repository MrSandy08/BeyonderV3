import config from "../config.js";

export const buildContext = (msg, sock) => { 
  console.log("🔍 [MSG] Full message object:", JSON.stringify(msg, null, 2));
  
  const body = 
    msg.message?.conversation || 
    msg.message?.extendedTextMessage?.text || 
    msg.message?.imageMessage?.caption ||
    msg.message?.videoMessage?.caption ||
    ""; 
 
  const isCommand = body.startsWith("!"); 
 
  const [commandRaw, ...args] = isCommand ? body.slice(1).trim().split(/\s+/) : ["", ""]; 
 
  const from = msg.key.remoteJid;
  let sender = msg.key.participant || from;
  
  // Check for participantAlt to get real JID instead of LID
  if (msg.participantAlt) {
    console.log("🔍 [MSG] Using participantAlt:", msg.participantAlt);
    sender = msg.participantAlt;
  }
  
  const senderName = msg.pushName || sender.split("@")[0];

  return { 
    sock, 
    raw: msg, 
    msg,
    body, 
    isCommand, 
    command: isCommand ? commandRaw?.toLowerCase() : null, 
    args, 
    sender, 
    senderName,
    from, 
    communityId: config.COMMUNITY_ID || "global",
    mentionedJids: msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [],
    reply: (text, mentions = []) => 
      sock.sendMessage(from, { text, mentions }, { quoted: msg }), 
    react: (emoji) => 
      sock.sendMessage(from, { react: { text: emoji, key: msg.key } }),
  }; 
}; 
