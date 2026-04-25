export const resolveTarget = (ctx) => { 
  const mention = ctx.raw.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]; 
  return mention || ctx.args[0] || null; 
}; 
