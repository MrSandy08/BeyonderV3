// src/services/initiativeService.js
import CommunityState from "../database/models/CommunityState.js";
import { getAiResponse } from "./iaService.js";

/**
 * Revisa grupos inactivos e inicia conversación si es necesario
 */
export const checkGroupInactivity = async (sock) => {
  const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);
  
  // Buscar comunidades inactivas hace más de 5 horas
  const inactiveStates = await CommunityState.find({
    lastActivity: { $lt: fiveHoursAgo }
  }).lean();

  for (const state of inactiveStates) {
    const { communityId } = state;
    
    // Solo hay un 20% de probabilidad de que inicie charla para no ser molesto
    if (Math.random() > 0.2) continue;

    console.log(`[INICIATIVA] Comunidad ${communityId} inactiva. Beyonder iniciará charla.`);

    // Obtener un grupo de esa comunidad (podemos guardarlos en Config o buscarlos en metaCache)
    // Para simplificar, si el communityId es un jid de grupo, lo usamos directamente
    if (communityId.endsWith("@g.us")) {
      const situation = "El grupo ha estado muy callado por más de 5 horas. Decides romper el hielo de forma orgánica.";
      const { text: response } = await getAiResponse("SISTEMA", communityId, communityId, "Beyonder", situation, [], true);

      if (response) {
        await sock.sendMessage(communityId, { text: response });
        // Actualizar actividad para no repetir inmediatamente
        await CommunityState.updateOne({ communityId }, { $set: { lastActivity: new Date() } });
      }
    }
  }
};
