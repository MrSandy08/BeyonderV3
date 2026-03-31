// src/rpg/middlewares/groupOnly.js
/**
 * Middleware para asegurar que los comandos RPG solo se ejecuten en grupos.
 * @param {Object} contexto - El contexto del comando (sock, from, etc.)
 * @returns {boolean} - Si puede continuar o no.
 */
export const groupOnly = async (contexto) => {
  const { from, reply } = contexto;

  if (!from.endsWith('@g.us')) {
    await reply("⚔️ Beyonder RPG solo puede jugarse dentro de un grupo.");
    return false;
  }
  return true;
};
