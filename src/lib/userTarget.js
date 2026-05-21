// src/lib/userTarget.js
/**
 * Detecta al usuario objetivo basado en prioridades:
 * 1. Mensaje citado (Quoted)
 * 2. Mención directa (@tag)
 * 3. Nombre del personaje (Búsqueda en MongoDB por Comunidad)
 * 4. Por defecto: El usuario que ejecuta el comando
 *
 * @param {Object} contexto - Contexto del comando (msg, from, sender, args, etc.)
 * @param {Object} User - Modelo de MongoDB de Usuario
 * @param {boolean} returnFullInfo - Si es true, retorna { jid, source }
 * @returns {Promise<string|Object>} - JID del usuario objetivo o { jid, source }
 */
export const userTarget = async (contexto, User, returnFullInfo = false) => {
  const { from, sender, mentionedJids, msg, args, communityId } = contexto;

  // 1. Prioridad: Mensaje citado (Quoted)
  const mtype = Object.keys(msg.message || {})[0];
  const quoted = msg.message?.[mtype]?.contextInfo?.participant;
  
  if (quoted) {
    return returnFullInfo ? { jid: quoted, source: "quoted" } : quoted;
  }

  // 2. Prioridad: Mención directa (@tag)
  if (mentionedJids && mentionedJids.length > 0) {
    return returnFullInfo ? { jid: mentionedJids[0], source: "mention" } : mentionedJids[0];
  }

  // 3. Prioridad: Nombre del personaje (Búsqueda en MongoDB por Comunidad)
  if (args && args.length > 0) {
    const primerArg = args[0].replace(/@\d+/g, "").trim();
    if (primerArg) {
      const escapedArg = primerArg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const userPorPrimerArg = await User.findOne({
        communityId,
        personaje: { $regex: new RegExp(`^${escapedArg}$`, "i") }
      }).select("jid").lean();
      if (userPorPrimerArg) {
        return returnFullInfo ? { jid: userPorPrimerArg.jid, source: "args" } : userPorPrimerArg.jid;
      }
    }

    const busquedaCompleta = args.join(" ").replace(/@\d+/g, "").trim();
    if (busquedaCompleta && busquedaCompleta !== primerArg) {
      const escapedFull = busquedaCompleta.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const userConPj = await User.findOne({
        communityId,
        personaje: { $regex: new RegExp(`^${escapedFull}$`, "i") }
      }).select("jid").lean();
      if (userConPj) {
        return returnFullInfo ? { jid: userConPj.jid, source: "args_full" } : userConPj.jid;
      }
    }
  }

  // 4. Por defecto: El usuario que ejecuta el comando
  return returnFullInfo ? { jid: sender, source: "default" } : sender;
};

export default userTarget;
