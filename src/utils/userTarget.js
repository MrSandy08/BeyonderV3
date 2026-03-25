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
  const { from, sender, mentionedJids, msg, args } = contexto;

  // 1. Prioridad: Mensaje citado (Quoted)
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.participant || 
                 msg.message?.imageMessage?.contextInfo?.participant ||
                 msg.message?.videoMessage?.contextInfo?.participant;
  if (quoted) return returnFullInfo ? { jid: quoted, source: "quoted" } : quoted;

  // 2. Prioridad: Mención directa (@tag)
  if (mentionedJids && mentionedJids.length > 0) return returnFullInfo ? { jid: mentionedJids[0], source: "mention" } : mentionedJids[0];

  // 3. Prioridad: Nombre del personaje (Búsqueda en MongoDB por Comunidad)
  if (args && args.length > 0) {
    // Intentar primero con el primer argumento (ej: !rp @user Nombre o !rp PJAntiguo Nombre)
    const primerArg = args[0].replace(/@\d+/g, "").trim();
    if (primerArg) {
      const userPorPrimerArg = await User.findOne({
        groupId: from,
        personaje: { $regex: new RegExp(`^${primerArg}$`, "i") }
      }).select("jid").lean();
      if (userPorPrimerArg) {
        console.log(`[Target] PJ encontrado por primer arg: ${primerArg} -> ${userPorPrimerArg.jid} en ${from}`);
        return returnFullInfo ? { jid: userPorPrimerArg.jid, source: "args" } : userPorPrimerArg.jid;
      }
    }

    // Si no se encontró por el primer arg, intentar con todo el texto (ej: !info Nombre Completo)
    const busquedaCompleta = args.join(" ").replace(/@\d+/g, "").trim();
    if (busquedaCompleta && busquedaCompleta !== primerArg) {
      const userConPj = await User.findOne({
        groupId: from,
        personaje: { $regex: new RegExp(`^${busquedaCompleta}$`, "i") }
      }).select("jid").lean();
      if (userConPj) {
        console.log(`[Target] PJ encontrado: ${busquedaCompleta} -> ${userConPj.jid} en ${from}`);
        return returnFullInfo ? { jid: userConPj.jid, source: "args_full" } : userConPj.jid;
      }
    }
  }

  // 4. Por defecto: El usuario que ejecuta el comando
  return returnFullInfo ? { jid: sender, source: "default" } : sender;
};

export default userTarget;
