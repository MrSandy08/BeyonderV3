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
    console.log(`[DEBUG TARGET] Detectado por Quoted: ${quoted}`);
    return returnFullInfo ? { jid: quoted, source: "quoted" } : quoted;
  }

  // 2. Prioridad: Mención directa (@tag)
  if (mentionedJids && mentionedJids.length > 0) {
    console.log(`[DEBUG TARGET] Detectado por Mención: ${mentionedJids[0]}`);
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
        console.log(`[DEBUG TARGET] PJ encontrado por primer arg: ${primerArg} -> ${userPorPrimerArg.jid} (Comunidad: ${communityId})`);
        return returnFullInfo ? { jid: userPorPrimerArg.jid, source: "args" } : userPorPrimerArg.jid;
      }
    }

    // Si no se encontró por el primer arg, intentar con todo el texto (ej: !info Nombre Completo)
    const busquedaCompleta = args.join(" ").replace(/@\d+/g, "").trim();
    if (busquedaCompleta && busquedaCompleta !== primerArg) {
      const escapedFull = busquedaCompleta.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const userConPj = await User.findOne({
        communityId,
        personaje: { $regex: new RegExp(`^${escapedFull}$`, "i") }
      }).select("jid").lean();
      if (userConPj) {
        console.log(`[DEBUG TARGET] PJ encontrado por búsqueda completa: ${busquedaCompleta} -> ${userConPj.jid} (Comunidad: ${communityId})`);
        return returnFullInfo ? { jid: userConPj.jid, source: "args_full" } : userConPj.jid;
      }
    }
  }

  // 4. Por defecto: El usuario que ejecuta el comando
  console.log(`[DEBUG TARGET] Por defecto: ${sender}`);
  return returnFullInfo ? { jid: sender, source: "default" } : sender;
};

export default userTarget;
