// src/comandos/general/adoptar.js
import User from "../../database/models/User.js";
import { solicitudes } from "../../store/solicitudes.js";
import { aviso } from "../../utils/format.js";
import userTarget from "../../utils/userTarget.js";
import { isAncestor, areSiblings } from "../../utils/kinship.js";

export const name      = "adoptar";
export const aliases   = ["adopt"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

const numFromJid   = (jid) => jid?.split("@")[0] || jid;
const primerNombre = (n)   => n?.split(" ")[0] || n || "???";
const EXPIRA_MS    = 30 * 60 * 1000;

export const run = async (contexto) => {
  const { reply, sender, from, sock, msg, args, communityId } = contexto;

  // Detectar objetivo: mención o personaje
  let targets = (contexto.mentionedJids || []).filter(j => j !== sender);
  
  if (!targets.length && args.length > 0) {
    const targetPj = await userTarget(contexto, User);
    if (targetPj && targetPj !== sender) {
      targets = [targetPj];
    }
  }

  if (!targets.length) return reply(aviso("Menciona a quien quieres adoptar o escribe su personaje.\n       𝄄   _!adoptar @usuario_ o _!adoptar Personaje_"));

  const targetId = targets[0];
  if (targetId === sender) return reply(aviso("No puedes adoptarte a ti mismo."));

  const miUsuario = await User.findOne({ jid: sender, communityId }).lean();
  if (!miUsuario?.personaje) return reply(aviso("Necesitas tener un *personaje* asignado globalmente para adoptar."));

  const targetUsuario = await User.findOne({ jid: targetId, communityId }).lean();
  if (!targetUsuario?.personaje) return reply(aviso(`@${numFromJid(targetId)} no tiene personaje asignado globalmente.`), [targetId]);

  // ── VALIDACIONES DE PARENTESCO ─────────────────────────────────────────────

  // 1. Matrimonio: Si ya están casados, no pueden adoptarse.
  if (miUsuario.parejas?.includes(targetId)) {
    return reply(aviso(`Ya tienes un lazo marital con *${primerNombre(targetUsuario.personaje)}*. No puedes adoptarlo.`));
  }

  // 2. Ya tiene padre/madre: Si el objetivo ya tiene un padre/madre, no puede ser adoptado por otro (o ya es tuyo).
  if (targetUsuario.kinship?.parent) {
    if (targetUsuario.kinship.parent === sender) {
      return reply(aviso(`*${primerNombre(targetUsuario.personaje)}* ya es tu hijo/a.`));
    }
    const parent = await User.findOne({ jid: targetUsuario.kinship.parent, communityId }).lean();
    return reply(aviso(`*${primerNombre(targetUsuario.personaje)}* ya ha sido adoptado/a por *${primerNombre(parent?.personaje || numFromJid(targetUsuario.kinship.parent))}*.`));
  }

  // 3. Circularidad: El objetivo no puede ser tu ancestro (padre, abuelo...).
  const esAncestro = await isAncestor(targetId, sender, communityId);
  if (esAncestro) {
    return reply(aviso(`¡No puedes adoptar a tu antecesor! *${primerNombre(targetUsuario.personaje)}* es parte de tu linaje directo.`));
  }

  // 4. Hermanos: No pueden adoptarse entre sí.
  const sonHermanos = await areSiblings(sender, targetId, communityId);
  if (sonHermanos) {
    return reply(aviso(`¡No puedes adoptar a tu hermano/a! Comparten el mismo origen.`));
  }

  // ── SOLICITUD DE ADOPCIÓN ──────────────────────────────────────────────────

  const miNombre     = primerNombre(miUsuario.personaje);
  const targetNombre = primerNombre(targetUsuario.personaje);

  const sent = await sock.sendMessage(from, {
    text:
      `  ┆ ⤿ 🧸 ⌗ 𐔌 . @${numFromJid(targetId)}\n\n` +
      `Con ternura y compromiso, *${miNombre}* desea brindarte un hogar y adoptarte como su hijo/a.\n\n` +
      `¿Aceptas formar parte de su linaje y ser su descendiente? 🧸\n\n` +
      `       𝄄   🌸 *!aceptar*\n       𝄄   🥀 *!rechazar*\n\n` +
      `       𝄄   _Esta oportunidad de familia expirará en 30 minutos..._`,
    mentions: [targetId],
  }, { quoted: msg });

  const key   = `${from}_${sender}`;
  const timer = setTimeout(() => {
    solicitudes.delete(key);
    sock.sendMessage(from, { text: aviso(`La propuesta de adopción de *${miNombre}* expiró sin respuesta. 🧸`) }).catch(() => {});
  }, EXPIRA_MS);

  solicitudes.set(key, { 
    sender, 
    targets: [targetId], 
    pendientes: new Set([targetId]), 
    rechazados: new Set(), 
    type: "adopt", // <--- IMPORTANTE: Distinguir de 'marry'
    expira: Date.now() + EXPIRA_MS, 
    msgId: sent.key.id, 
    timer 
  });
};
