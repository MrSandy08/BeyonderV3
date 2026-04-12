// src/utils/socialFilter.js
import BeyonderCore from "../database/models/BeyonderCore.js";
import Affinity from "../database/models/Affinity.js";
import CommunityState from "../database/models/CommunityState.js";

/**
 * Determina si Beyonder debería responder de forma orgánica a un mensaje/media.
 * @returns {Promise<boolean>}
 */
export async function shouldRespondOrganically(contexto) {
  const { sender, communityId, isGroup, isMencionDirecta, isMorboso, texto, visualTags } = contexto;

  // 1. Siempre responde a menciones directas o replies
  if (isMencionDirecta) return true;

  // 2. Obtener estado de Beyonder y Afinidad
  const [core, aff, state] = await Promise.all([
    BeyonderCore.findOne().lean(),
    Affinity.findOne({ jid: sender, communityId }).lean(),
    CommunityState.findOne({ communityId }).lean()
  ]);

  if (!core) return false;

  const paciencia = core.status.patience;
  const afinidad = aff?.points || 0;
  const tension = state?.tension || 0;

  // 3. Lógica de "Ganas de hablar" (Energía Social)
  // Si tiene poca paciencia, solo habla con sus mejores amigos o si es muy importante
  if (paciencia < 20) {
    if (afinidad > 90) return true; // Con mejores amigos hace el esfuerzo
    if (isMorboso && paciencia > 5) return true; // El morbo le da un pico de energía
    return false;
  }

  // 4. Lógica de "Interés en el Contenido" (Saliencia)
  let interes = 0;
  
  // El morbo es muy interesante para Beyonder
  if (isMorboso) interes += 8;
  
  // Gustos personales (basados en tags de CLIP)
  if (visualTags && visualTags.length > 0) {
    const likes = core.identity.likes || [];
    const coincideLike = visualTags.some(tag => likes.includes(tag.toLowerCase()));
    if (coincideLike) interes += 5;
  }

  // Longitud y esfuerzo del mensaje (un "hola" no interesa, una anécdota sí)
  if (texto && texto.length > 30) interes += 3;

  // 5. Lógica de "Contexto Social" (Tensión)
  // Si hay una pelea (tensión alta), Beyonder se mete a opinar
  if (tension > 70) interes += 6;

  // 6. Decisión Final basada en Interés vs Afinidad
  // Beyonder v4.5.5: Umbrales aumentados para evitar "spam" de respuestas
  // A mayor afinidad, menos interés requiere para responder
  const umbralInteres = afinidad > 90 ? 5 : (afinidad > 50 ? 8 : 12);

  return interes >= umbralInteres;
}
