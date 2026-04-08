import User from '../database/models/User.js';

/**
 * Verifica si un usuario es ancestro de otro (circularidad).
 * @param {string} ancestorJid - El posible ancestro.
 * @param {string} userJid - El usuario a revisar.
 * @param {string} communityId - ID de la comunidad.
 * @returns {Promise<boolean>}
 */
export async function isAncestor(ancestorJid, userJid, communityId) {
  if (!userJid || !ancestorJid) return false;
  
  let current = await User.findOne({ jid: userJid, communityId }).lean();
  while (current && current.kinship?.parent) {
    if (current.kinship.parent === ancestorJid) return true;
    current = await User.findOne({ jid: current.kinship.parent, communityId }).lean();
  }
  
  return false;
}

/**
 * Verifica si dos usuarios son hermanos (mismo padre/madre).
 * @param {string} user1Jid
 * @param {string} user2Jid
 * @param {string} communityId
 * @returns {Promise<boolean>}
 */
export async function areSiblings(user1Jid, user2Jid, communityId) {
  const u1 = await User.findOne({ jid: user1Jid, communityId }).lean();
  const u2 = await User.findOne({ jid: user2Jid, communityId }).lean();
  
  if (!u1?.kinship?.parent || !u2?.kinship?.parent) return false;
  return u1.kinship.parent === u2.kinship.parent;
}
