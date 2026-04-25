import eventBus from "./eventBus.js"; 
import { buildContext } from "./contextBuilder.js"; 
import Config from "../database/models/Config.js";
import config from "../config.js";
 
export const handleMessage = async (msg, sock) => { 
  const ctx = buildContext(msg, sock); 
 
  // 1. Obtener configuración del grupo/comunidad
  const groupConfig = await Config.findOne({ groupId: ctx.from }).lean();
  ctx.config = groupConfig || { botActivo: true };
  if (groupConfig?.communityId) ctx.communityId = groupConfig.communityId;

  // 2. Verificar si el bot está activo (solo ignorar si no es owner)
  const isOwner = config.OWNERS.includes(ctx.sender);
  if (!ctx.config.botActivo && !isOwner) {
    // Si el bot está apagado y no es owner, ignoramos el comando
    if (ctx.isCommand) return;
    // También podríamos ignorar mensajes normales si se desea
  }

  // Evento global 
  await eventBus.emit("message_received", ctx); 
 
  // Evento de comando 
  if (ctx.isCommand) { 
    await eventBus.emit("command_executed", ctx); 
  } 
 
  // Actividad siempre 
  await eventBus.emit("activity", ctx); 
}; 
