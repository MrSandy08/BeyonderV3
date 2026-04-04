import User from '../database/models/User.js';

/**
 * Verifica si un usuario es ancestro de otro (circularidad).
 * @param {string} ancestorJid - El posible ancestro.
 * @param {string} userJid - El usuario a revisar.
 * @param {string} groupId - El ID del grupo.
 * @returns {Promise<boolean>}
 */
export async function isAncestor(ancestorJid, userJid, groupId) {
  if (!userJid || !ancestorJid) return false;
  
  let current = await User.findOne({ jid: userJid, groupId }).lean();
  while (current && current.kinship?.parent) {
    if (current.kinship.parent === ancestorJid) return true;
    current = await User.findOne({ jid: current.kinship.parent, groupId }).lean();
  }
  
  return false;
}

/**
 * Verifica si dos usuarios son hermanos (mismo padre/madre).
 * @param {string} user1Jid
 * @param {string} user2Jid
 * @param {string} groupId
 * @returns {Promise<boolean>}
 */
export async function areSiblings(user1Jid, user2Jid, groupId) {
  const u1 = await User.findOne({ jid: user1Jid, groupId }).lean();
  const u2 = await User.findOne({ jid: user2Jid, groupId }).lean();
  
  if (!u1?.kinship?.parent || !u2?.kinship?.parent) return false;
  return u1.kinship.parent === u2.kinship.parent;
}
