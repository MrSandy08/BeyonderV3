// src/events/groupUpdate.js
import CommunityState from "../database/models/CommunityState.js";
import Affinity from "../database/models/Affinity.js";
import Config from "../database/models/Config.js";
import Group from "../database/models/Group.js";
import User from "../database/models/User.js";
import { aviso, header, listItem, listSection } from "../utils/format.js";

/**
 * Maneja las actualizaciones de participantes en grupos (joins, kicks, leaves)
 */
export const handleGroupParticipantsUpdate = async (update, sock) => {
  const { id, participants, action, author } = update;
  
  // 1. Registrar grupo si no existe
  await Group.findOneAndUpdate({ _id: id }, { _id: id }, { upsert: true });
  
  // 2. Obtener communityId
  const cfg = await Config.findOne({ groupId: id }).lean();
  const meta = await sock.groupMetadata(id).catch(() => null);
  const communityId = meta?.linkedParent || cfg?.communityId || id;

  for (const jid of participants) {
    const rel = await Affinity.findOne({ jid, communityId }).lean();
    const userName = jid.split("@")[0];
    
    // Actualizar estado de la comunidad
    let state = await CommunityState.findOne({ communityId });
    if (!state) state = await CommunityState.create({ communityId });

    let eventType = "";
    let eventDesc = "";
    let moodChange = "Neutral";

    if (action === "add") {
      eventType = "join";
      eventDesc = `El usuario @${userName} se unió al grupo.`;
      if (rel?.points > 50) moodChange = "Eufórico";
    } else if (action === "remove") {
      const isKick = author !== jid;
      eventType = isKick ? "kick" : "leave";
      
      if (isKick) {
        eventDesc = `El usuario @${userName} fue expulsado por @${author?.split("@")[0]}.`;
        if (rel?.points > 50) moodChange = "Enojado";
        else if (rel?.points < -30) moodChange = "Eufórico";
      } else {
        eventDesc = `El usuario @${userName} abandonó el grupo.`;
        if (rel?.points > 50) moodChange = "Triste";
      }
      
      // SUA-Bot: Auto-liberar personaje si el usuario se va
      const user = await User.findOne({ jid, communityId });
      if (user && user.personaje) {
        const char = user.personaje;
        const fandom = user.fandom;
        
        // Liberar personaje
        user.personaje = null;
        user.fandom = null;
        await user.save();

        // Notificar en el grupo actual
        const text = header("Notificación de Salida") + "\n" +
                     aviso(`El usuario @${jid.split("@")[0]} ha dejado el grupo/comunidad.\n\nEl personaje *${char}* (${fandom}) queda *LIBRE*.`);
        
        await sock.sendMessage(id, { text, mentions: [jid] });
        
        // Notificar a todos los demás grupos
        const groups = await Group.find({ _id: { $ne: id } });
        for (let g of groups) {
          await sock.sendMessage(g._id, { text, mentions: [jid] }).catch(() => null);
        }
      }
    }

    if (eventType) {
      await CommunityState.updateOne(
        { communityId },
        { 
          $set: { 
            mood: moodChange,
            lastMajorEvent: {
              type: eventType,
              description: eventDesc,
              timestamp: new Date(),
              participant: jid
            },
            lastActivity: new Date()
          },
          $inc: { tension: action === "remove" ? 10 : -5 }
        }
      );
    }
  }
};

/**
 * Maneja las actualizaciones de metadatos del grupo (nombre, descripción, etc.)
 */
export const handleGroupUpdate = async (updates, sock) => {
  for (const update of updates) {
    const { id, subject, desc, announce } = update;
    if (!id) continue;

    const cfg = await Config.findOne({ groupId: id }).lean();
    const meta = await sock.groupMetadata(id).catch(() => null);
    const communityId = meta?.linkedParent || cfg?.communityId || id;

    let eventDesc = "";
    if (subject) eventDesc = `El nombre del grupo cambió a: "${subject}".`;
    if (desc) eventDesc = `La descripción del grupo fue actualizada.`;
    if (announce !== undefined) eventDesc = announce ? "El grupo fue cerrado (solo admins)." : "El grupo fue abierto para todos.";

    if (eventDesc) {
      await CommunityState.updateOne(
        { communityId },
        { 
          $set: { 
            "lastMajorEvent.type": "group_update",
            "lastMajorEvent.description": eventDesc,
            "lastMajorEvent.timestamp": new Date()
          },
          $inc: { tension: 5 }
        }
      );
    }
  }
};
