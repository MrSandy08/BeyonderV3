// src/comandos/general/rp.js
// Cubre: !rp [nombre] | !rp quitar | !lista | !inactivos | !pedir | !buscados
import User     from "../../database/models/User.js";
import Buscados from "../../database/models/Buscados.js";
import config   from "../../config.js";
import { aviso, listSection, listItem, inactividadIcon } from "../../utils/format.js";
import userTarget from "../../utils/userTarget.js";

export const name      = "rp";
export const aliases   = ["lista", "inactivos", "pedir", "buscados"];
export const onlyAdmin = false;
export const onlyMod   = false; // la validación de asignación se hace dentro del run
export const onlyOwner = false;

const numFromJid   = (jid) => jid?.split("@")[0] || jid;
const normNombre   = (n)   => n?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() || "";

// ─────────────────────────────────────────────────────────────────────────────

export const run = async (contexto) => {
  const { reply, react, sender, args, isMod, isOwner, isWAAdmin, mentionedJids, msg, cfg } = contexto;

  const rawBody = (
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text || ""
  ).trim().toLowerCase();

  // ══════════════════════════════════════════════
  //  !buscados — público
  // ══════════════════════════════════════════════
  if (rawBody === "!buscados") {
    const lista = await Buscados.find({}).lean();
    if (!lista.length) return reply(aviso("No hay personajes pedidos actualmente."));

    let txt = `\u200e \u200e \u200e  \u200e \u200e⤹ ⊹ ୨୧ 𝗣𝗲𝗿𝘀𝗼𝗻𝗮𝗷𝗲𝘀 𝗕𝘂𝘀𝗰𝗮𝗱𝗼𝘀 ⿻ ₊˚๑\n`;
    txt += listSection("𝓟edidos");
    lista.forEach((b, i) => { txt += listItem(`${i + 1}. *${b.personaje}*`) + "\n"; });
    return reply(txt);
  }

  // ══════════════════════════════════════════════
  //  !pedir [nombre] — público
  // ══════════════════════════════════════════════
  if (rawBody.startsWith("!pedir")) {
    const { from } = contexto;
    const nombre = args.slice(0).join(" ").trim();
    if (!nombre) return reply(aviso("Escribe el nombre del personaje que buscas.\n       𝄄   _Ej: !pedir Itachi Uchiha_"));

    const yaOcupado = await User.findOne({ groupId: from, personaje: new RegExp(`^${nombre}$`, "i") }).lean();
    if (yaOcupado) return reply(aviso(`*"${nombre}"* ya está ocupado por alguien en este grupo.`));

    const yaEnLista = await Buscados.findOne({ personaje: new RegExp(`^${nombre}$`, "i") }).lean();
    if (yaEnLista) return reply(aviso(`*"${nombre}"* ya está en la lista de buscados.`));

    await Buscados.create({ personaje: nombre, pedidoPor: sender });
    await react("✅");
    return reply(aviso(`*"${nombre}"* añadido a buscados. 🔍`));
  }

  // ══════════════════════════════════════════════
  //  !lista — público
  // ══════════════════════════════════════════════
  if (rawBody === "!lista") {
    const { from, meta } = contexto;
    const todos = await User.find({ groupId: from, personaje: { $ne: null } }).lean();
    if (!todos.length) return reply(aviso("No hay personajes registrados todavía en este grupo."));

    const adminsJids = meta?.participants?.filter(p => p.admin === "admin" || p.admin === "superadmin").map(p => p.id) || [];
    
    // Staff son los admins de WA + los owners globales
    const staff    = todos.filter(u => adminsJids.includes(u.jid) || u.permisos === 3 || config.OWNERS.includes(u.jid));
    const miembros = todos.filter(u => !staff.find(s => s.jid === u.jid));

    let txt = `\u200e \u200e \u200e  \u200e \u200e⤹ ⊹ ୨୧ 𝗟𝗶𝘀𝘁𝗮 𝗱𝗲 𝗣𝗲𝗿𝘀𝗼𝗻𝗮𝗷𝗲𝘀 ⿻ ₊˚๑\n`;

    if (staff.length) {
      txt += listSection("𝓢TAFF");
      staff.forEach(u => {
        txt += listItem(u.personaje, inactividadIcon(u.lastMessage));
      });
    }

    if (miembros.length) {
      txt += "\n" + listSection("𝓜IEMBROS");
      miembros.forEach(u => {
        txt += listItem(u.personaje, inactividadIcon(u.lastMessage));
      });
    }

    txt += `\n       𝄄   _🔹 +3 días · 🔸 +7 días · ▪️ Nunca habló_`;
    return reply(txt);
  }

  // ══════════════════════════════════════════════
  //  !inactivos — público
  // ══════════════════════════════════════════════
  if (rawBody === "!inactivos") {
    const { from } = contexto;
    const todos     = await User.find({ groupId: from, personaje: { $ne: null } }).lean();
    const inactivos = todos.filter(u => inactividadIcon(u.lastMessage) !== "");

    if (!inactivos.length) return reply(aviso("✅ ¡Todos están activos! Sin inactivos."));

    let txt = `\u200e \u200e \u200e  \u200e \u200e ⤹ ⊹ ୨୧ 𝗥𝗲𝗴𝗶𝘀𝘁𝗿𝗼 𝗱𝗲 𝗜𝗻𝗮𝗰𝘁𝗶𝘃𝗶𝗱𝗮𝗱 ⿻ ₊˚๑\n`;
    txt += listSection("𝓘nactivos");
    inactivos.forEach(u => {
      txt += listItem(u.personaje, inactividadIcon(u.lastMessage));
    });
    txt += `\n𝄄   _🔹 +3 días · 🔸 +7 días · ▪️ Nunca`;
    return reply(txt);
  }

  // ══════════════════════════════════════════════
  //  !rp quitar [@user] — Mod/Owner para otros,
  //  cualquiera puede quitarse el suyo propio
  // ══════════════════════════════════════════════
  if (rawBody.startsWith("!rp quitar") || (rawBody.startsWith("!rp") && args[0]?.toLowerCase() === "quitar")) {
    const { from } = contexto;
    const puedeOtros = isMod || isOwner;
    
    // Si es !rp quitar @user o !rp quitar Personaje, detectamos el objetivo
    // Quitamos "quitar" de los argumentos para que userTarget no lo confunda con un PJ
    const argsTarget = args.filter(a => a.toLowerCase() !== "quitar");
    const objetivo = puedeOtros ? await userTarget({ ...contexto, args: argsTarget }, User) : sender;
    const esOtro   = objetivo !== sender;

    if (esOtro && !puedeOtros)
      return reply(aviso("Solo *Moderadores* u Owners pueden quitar el personaje de otro."));

    if (cfg?.lockRp && !isOwner)
      return reply(aviso("🔒 Los personajes están bloqueados. Solo el Owner puede modificarlos."));

    const u = await User.findOne({ jid: objetivo, groupId: from }).lean();
    if (!u?.personaje)
      return reply(aviso(`*${numFromJid(objetivo)}* no tiene personaje asignado en este grupo.`));

    const nombreAntes = u.personaje;
    await User.findOneAndUpdate({ jid: objetivo, groupId: from }, { $set: { personaje: null } });
    await react("✅");
    return reply(aviso(`*${nombreAntes}* fue removido de *${numFromJid(objetivo)}*.`));
  }

  // ══════════════════════════════════════════════
  //  !rp [nombre] — SOLO Mod/Owner pueden asignar
  // ══════════════════════════════════════════════
  if (!isMod && !isOwner) {
    return reply(aviso("Solo *Moderadores* u Owners pueden asignar personajes."));
  }

  if (cfg?.lockRp && !isOwner)
    return reply(aviso("🔒 Los personajes están bloqueados. Solo el Owner puede modificarlos."));

  // Objetivo: si hay mención o PJ asigna a ese, si no, al que lo usa
  const { from } = contexto;
  const targetInfo = await userTarget(contexto, User, true);
  const objetivo   = targetInfo.jid;
  const source     = targetInfo.source;
  
  // Limpiar el nombre
  // Si el objetivo se encontró por mención o por el primer argumento, el nombre real empieza en args[1]
  let nombre = args.join(" ").replace(/@\d+/g, "").trim();
  
  if (source === "mention" || source === "args") {
    if (args.length > 1) {
      nombre = args.slice(1).join(" ").trim();
    }
  }

  if (!nombre || nombre === "") {
    return reply(
      aviso(
        "Uso del comando RP:\n" +
        "       𝄄   _!rp [nombre]_ — Asignarte un personaje en este grupo\n" +
        "       𝄄   _!rp @user [nombre]_ — Asignar a otro usuario en este grupo\n" +
        "       𝄄   _!rp quitar [@user]_ — Quitar personaje"
      )
    );
  }

  // Verificar duplicado en este grupo
  const dup = await User.findOne({
    groupId:   from,
    jid:       { $ne: objetivo },
    personaje: new RegExp(`^${nombre}$`, "i"),
  }).lean();
  if (dup) return reply(aviso(`*"${nombre}"* ya pertenece a *${dup.personaje}* en este grupo.`));

  // Actualizar o crear registro usando llave compuesta (jid + groupId)
  await User.updateOne(
    { jid: objetivo, groupId: from },
    { $set: { personaje: nombre, lastPersoChange: new Date() } },
    { upsert: true }
  );
  console.log(`[RP] Guardado: ${nombre} para ${objetivo} en ${from}`);

  // Si el nombre estaba en buscados → eliminar automáticamente
  const enBuscados = await Buscados.findOneAndDelete({
    personaje: new RegExp(`^${nombre}$`, "i"),
  });

  await react("✅");
  const notaBuscados = enBuscados ? "\n       𝄄   _(Eliminado de la lista de buscados 🔍)_" : "";
  await reply(
    aviso(`*${nombre}* vinculado a @${numFromJid(objetivo)}.${notaBuscados}`),
    [objetivo]
  );
};
