// src/middlewares/permissions.js
import config from "../config.js";
import User from "../database/models/User.js";

/**
 * Verifica si un usuario tiene el nivel de permisos requerido.
 *
 * Niveles:
 *   0 → User   (todos)
 *   1 → Helper
 *   2 → Admin
 *   3 → Owner  (global)
 *
 * @param {string} jid      - JID de WhatsApp del usuario
 * @param {number} nivel    - Nivel mínimo requerido (0–3)
 * @param {string} groupId  - JID del grupo para permisos locales (Mod/Helper)
 * @returns {Promise<boolean>}
 */
const checkPermiso = async (jid, nivel = 0, groupId = "global") => {
  // ── Prioridad absoluta: Owner por config ───────────────────────────────────
  if (config.OWNERS.includes(jid)) return true;

  // ── Nivel 0: cualquiera puede ─────────────────────────────────────────────
  if (nivel === 0) return true;

  // ── Buscar si es Owner global en MongoDB ──────────────────────────────────
  try {
    const isOwner = await User.findOne({ jid, permisos: 3 }).lean();
    if (isOwner) return true;

    if (nivel === 3) return false; // Si llegamos aquí y nivel es 3, no es owner

    // ── Buscar permisos locales (Mod/Helper) ────────────────────────────────
    const usuario = await User.findOne({ jid, groupId }).select("permisos").lean();
    const permisoActual = usuario?.permisos ?? 0;

    return permisoActual >= nivel;
  } catch (error) {
    console.error(`❌ Error al verificar permisos de ${jid}:`, error.message);
    return false;
  }
};

export default checkPermiso;