import config from "../config.js";

export const buildContext = (msg, sock) => { 
  const body = 
    msg.message?.conversation || 
    msg.message?.extendedTextMessage?.text || 
    msg.message?.imageMessage?.caption ||
    msg.message?.videoMessage?.caption ||
    ""; 
 
  const isCommand = body.startsWith("!"); 
 
  const [commandRaw, ...args] = isCommand ? body.slice(1).trim().split(/\s+/) : ["", ""]; 
 
  const from = msg.key.remoteJid;
  const sender = msg.key.participant || from;
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
