// src/comandos/general/marry.js
import User from "../../database/models/User.js";
import { solicitudes } from "../../store/solicitudes.js";
import { aviso } from "../../utils/format.js";
import userTarget from "../../utils/userTarget.js";
import { isAncestor, areSiblings } from "../../utils/kinship.js";

export const name      = "marry";
export const aliases   = ["casar", "proponer"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

const numFromJid   = (jid) => jid?.split("@")[0] || jid;
const primerNombre = (n)   => n?.split(" ")[0] || n || "???";
const EXPIRA_MS    = 30 * 60 * 1000;

export const run = async (contexto) => {
  const { reply, sender, from, sock, msg, args } = contexto;

  // Detectar objetivos: menciones o personaje (solo el primer personaje si hay varios args)
  let targets = (contexto.mentionedJids || []).filter(j => j !== sender);
  
  if (!targets.length && args.length > 0) {
    const targetPj = await userTarget(contexto, User);
    if (targetPj && targetPj !== sender) {
      targets = [targetPj];
    }
  }

  if (!targets.length) return reply(aviso("Menciona a quien quieres proponer o escribe su personaje.\n       𝄄   _!marry @usuario_ o _!marry Personaje_"));

  const miUsuario = await User.findOne({ jid: sender, groupId: from }).lean();
  if (!miUsuario?.personaje) return reply(aviso("Necesitas tener un *personaje* asignado en este grupo para proponer."));

  if (miUsuario.parejas?.length > 0 && targets.length === 1) {
    const nombres = await Promise.all(miUsuario.parejas.map(async id => {
      const u = await User.findOne({ jid: id, groupId: from }).lean();
      return `*${primerNombre(u?.personaje || numFromJid(id))}*`;
    }));
    return reply(aviso(`Ya tienes pareja con ${nombres.join(", ")} en este grupo.\n       𝄄   _Para poliamor, menciona a *todos* en una sola propuesta._`));
  }

  const targetsValidos = [];
  for (const tId of targets) {
    const uT = await User.findOne({ jid: tId, groupId: from }).lean();
    if (!uT?.personaje) { await sock.sendMessage(from, { text: aviso(`@${numFromJid(tId)} no tiene personaje asignado en este grupo.`), mentions: [tId] }, { quoted: msg }); continue; }
    if (uT.parejas?.length > 0 && !targets.includes(uT.parejas[0])) { await sock.sendMessage(from, { text: aviso(`*${primerNombre(uT.personaje)}* ya tiene pareja en este grupo. 💔`), mentions: [tId] }, { quoted: msg }); continue; }
    
    // VALIDACIÓN DE INCESTO (Adopción / Kinship)
    // 1. ¿Es su hijo/descendiente?
    const esDescendiente = await isAncestor(sender, tId, from);
    if (esDescendiente) { await sock.sendMessage(from, { text: aviso(`¡No puedes casarte con un descendiente! *${primerNombre(uT.personaje)}* es de tu linaje.`), mentions: [tId] }, { quoted: msg }); continue; }
    
    // 2. ¿Es su padre/antecesor?
    const esAncestro = await isAncestor(tId, sender, from);
    if (esAncestro) { await sock.sendMessage(from, { text: aviso(`¡No puedes casarte con un antecesor! *${primerNombre(uT.personaje)}* es parte de tu linaje directo.`), mentions: [tId] }, { quoted: msg }); continue; }
    
    // 3. ¿Son hermanos?
    const sonHermanos = await areSiblings(sender, tId, from);
    if (sonHermanos) { await sock.sendMessage(from, { text: aviso(`¡No puedes casarte con tu hermano/a! Comparten el mismo origen.`), mentions: [tId] }, { quoted: msg }); continue; }

    targetsValidos.push(tId);
  }

  if (!targetsValidos.length) return;

  const miNombre     = primerNombre(miUsuario.personaje);
  const esPoliamor   = targetsValidos.length > 1 || miUsuario.parejas?.length > 0;
  const labelTargets = await Promise.all(targetsValidos.map(async id => {
    const u = await User.findOne({ jid: id, groupId: from }).lean();
    return `*${primerNombre(u?.personaje || numFromJid(id))}*`;
  }));

  const sent = await sock.sendMessage(from, {
    text:
      `  ┆ ⤿ 💌 ⌗ 𐔌 . ${targetsValidos.map(id => `@${numFromJid(id)}`).join(", ")}\n\n` +
      `Bajo la luz de las estrellas, *${miNombre}* ha decidido que quiere compartir su vida con ${labelTargets.join(" y ")}.\n\n` +
      `¿Acepta${targetsValidos.length > 1 ? "n" : "s"} este lazo eterno? 💍\n\n` +
      `       𝄄   🌸 *!aceptar*\n       𝄄   🥀 *!rechazar*\n\n` +
      `       𝄄   _El destino esperará solo 30 minutos..._`,
    mentions: targetsValidos,
  }, { quoted: msg });

  const key   = `${from}_${sender}`;
  const timer = setTimeout(() => {
    solicitudes.delete(key);
    sock.sendMessage(from, { text: aviso(`La propuesta de *${miNombre}* expiró sin respuesta. ⏳`) }).catch(() => {});
  }, EXPIRA_MS);

  solicitudes.set(key, { sender, targets: targetsValidos, pendientes: new Set(targetsValidos), rechazados: new Set(), esPoliamor, expira: Date.now() + EXPIRA_MS, msgId: sent.key.id, timer });
};
