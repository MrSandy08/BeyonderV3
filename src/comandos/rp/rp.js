// src/comandos/general/rp.js
// Cubre: !rp [nombre] | !rp quitar | !lista | !inactivos | !pedir | !buscados
import User     from "../../database/models/User.js";
import Buscados from "../../database/models/Buscados.js";
import config   from "../../config.js";
import { aviso, listSection, listItem, inactividadIcon } from "../../utils/format.js";
import userTarget from "../../utils/userTarget.js";

export const name      = "rp";
export const aliases   = ["lista", "inactivos", "pedir", "buscados", "personajes", "miembros", "sinpersonaje"];
export const onlyAdmin = false;
export const onlyMod   = false; // la validación de asignación se hace dentro del run
export const onlyOwner = false;

const numFromJid   = (jid) => jid?.split("@")[0] || jid;
const normNombre   = (n)   => n?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() || "";

// ─────────────────────────────────────────────────────────────────────────────

export const run = async (contexto) => {
  const { reply, react, sender, args, command, text, isMod, isOwner, isWAAdmin, mentionedJids, msg, cfg } = contexto;

  // ══════════════════════════════════════════════
  //  !sinpersonaje — público
  // ══════════════════════════════════════════════
  if (command === "sinpersonaje") {
    const { from } = contexto;
    const sinP = await User.find({ groupId: from, personaje: null }).lean();
    if (!sinP.length) return reply(aviso("✅ ¡Todos en este grupo tienen personaje!"));

    let txt = `\u200e \u200e \u200e  \u200e \u200e⤹ ⊹ ୨୧ 𝗨𝘀𝘂𝗮𝗿𝗶𝗼𝘀 𝘀𝗶𝗻 𝗣𝗲𝗿𝘀𝗼𝗻𝗮𝗷𝗲 ⿻ ₊˚๑\n`;
    txt += listSection("𝓡ecién Llegados");
    sinP.forEach((u, i) => {
      txt += listItem(`${i + 1}. @${numFromJid(u.jid)}`) + "\n";
    });
    return reply(txt, sinP.map(u => u.jid));
  }

  // ══════════════════════════════════════════════
  //  !buscados — público
  // ══════════════════════════════════════════════
  if (command === "buscados") {
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
  if (command === "pedir") {
    const { from } = contexto;
    const nombre = text;
    if (!nombre) return reply(aviso("Escribe el nombre del personaje que buscas.\n       𝄄   _Ej: !pedir Itachi Uchiha_"));

    const yaOcupado = await User.findOne({ personaje: new RegExp(`^${nombre}$`, "i") }).lean();
    if (yaOcupado) return reply(aviso(`*"${nombre}"* ya está ocupado globalmente por @${numFromJid(yaOcupado.jid)}.`));

    const yaEnLista = await Buscados.findOne({ personaje: new RegExp(`^${nombre}$`, "i") }).lean();
    if (yaEnLista) return reply(aviso(`*"${nombre}"* ya está en la lista de buscados.`));

    await Buscados.create({ personaje: nombre, pedidoPor: sender });
    await react("✅");
    return reply(aviso(`*"${nombre}"* añadido a buscados. 🔍`));
  }

  // ══════════════════════════════════════════════
  //  !lista — público con subcomandos
  // ══════════════════════════════════════════════
  if (command === "lista") {
    const { from, meta } = contexto;
    const sub = args[0]?.toLowerCase();

    // Prioridad 1: Subcomando administrativo 'ban'
    if (sub === "ban") {
      const baneados = await User.find({ isBanned: true }).lean();
      if (!baneados.length) return reply(aviso("No hay usuarios baneados en la base de datos."));

      let txt = `🚫 *LISTA DE BANEADOS*\n\n`;
      baneados.forEach((u, i) => {
        txt += `${i + 1}. @${u.jid.split("@")[0]}\n`;
      });
      return reply(txt, baneados.map(u => u.jid));
    }

    // Prioridad 2: Búsqueda de personaje si hay argumentos
    if (args.length > 0) {
      const query = text;
      const match = await User.findOne({ 
        personaje: new RegExp(`^${query}$`, "i") 
      }).lean();

      if (!match) return reply(aviso(`No se encontró ningún personaje con el nombre *"${query}"*.`));

      return reply(
        `👤 *DETALLES DEL PERSONAJE (GLOBAL)*\n\n` +
        `   - Nombre: *${match.personaje}*\n` +
        `   - Usuario: @${match.jid.split("@")[0]}\n` +
        `   - Última vez visto en: ${match.groupId.split("@")[0]}`,
        [match.jid]
      );
    }

    // Prioridad 3: Lista general (sin argumentos)
    // Mostramos todos los personajes de la DB global, pero marcamos los del grupo actual
    const todosGlobal = await User.find({ personaje: { $ne: null } }).lean();
    if (!todosGlobal.length) return reply(aviso("No hay personajes registrados todavía."));

    const delGrupo = todosGlobal.filter(u => u.groupId === from);
    const otros   = todosGlobal.filter(u => u.groupId !== from);

    const adminsJids = meta?.participants?.filter(p => p.admin === "admin" || p.admin === "superadmin").map(p => p.id) || [];
    
    // Staff son los admins de WA + los owners globales
    const staff    = delGrupo.filter(u => adminsJids.includes(u.jid) || u.permisos === 3 || config.OWNERS.includes(u.jid));
    const miembros = delGrupo.filter(u => !staff.find(s => s.jid === u.jid));

    let txt = `\u200e \u200e \u200e  \u200e \u200e⤹ ⊹ ୨୧ 𝗟𝗶𝘀𝘁𝗮 𝗚𝗹𝗼𝗯𝗮𝗹 𝗱𝗲 𝗣𝗲𝗿𝘀𝗼𝗻𝗮𝗷𝗲𝘀 ⿻ ₊˚๑\n`;

    if (staff.length) {
      txt += listSection("𝓢TAFF (ESTE GRUPO)");
      staff.forEach(u => {
        txt += listItem(u.personaje, inactividadIcon(u.lastMessage));
      });
    }

    if (miembros.length) {
      txt += "\n" + listSection("𝓜IEMBROS (ESTE GRUPO)");
      miembros.forEach(u => {
        txt += listItem(u.personaje, inactividadIcon(u.lastMessage));
      });
    }

    if (otros.length) {
      txt += "\n" + listSection("𝓞TROS GRUPOS");
      otros.forEach(u => {
        txt += listItem(u.personaje, "🌐");
      });
    }

    txt += `\n       𝄄   _🔹 +3 días · 🔸 +7 días · ▪️ Nunca habló_`;
    return reply(txt);
  }

  // ══════════════════════════════════════════════
  //  !inactivos — público
  // ══════════════════════════════════════════════
  if (command === "inactivos") {
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
  if (command === "rp" && args[0]?.toLowerCase() === "quitar") {
    const { from } = contexto;
    const puedeOtros = isMod || isOwner;
    
    // Si es !rp quitar @user o !rp quitar Personaje, detectamos el objetivo
    // Quitamos "quitar" de los argumentos para que userTarget no lo confunda con un PJ
    const argsTarget = args.slice(1);
    const objetivo = puedeOtros ? await userTarget({ ...contexto, args: argsTarget }, User) : sender;
    const esOtro   = objetivo !== sender;

    if (esOtro && !puedeOtros)
      return reply(aviso("Solo *Moderadores* u Owners pueden quitar el personaje de otro."));

    if (cfg?.lockRp && !isOwner)
      return reply(aviso("🔒 Los personajes están bloqueados. Solo el Owner puede modificarlos."));

    const u = await User.findOne({ jid: objetivo }).lean();
    if (!u?.personaje)
      return reply(aviso(`@${numFromJid(objetivo)} no tiene personaje asignado globalmente.`));

    const nombreAntes = u.personaje;
    await User.findOneAndUpdate({ jid: objetivo }, { $set: { personaje: null } });
    await react("✅");
    return reply(aviso(`*${nombreAntes}* fue removido globalmente de @${numFromJid(objetivo)}.`));
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

  // Verificar duplicado GLOBALMENTE
  const dup = await User.findOne({
    jid:       { $ne: objetivo },
    personaje: new RegExp(`^${nombre}$`, "i"),
  }).lean();
  if (dup) return reply(aviso(`*"${nombre}"* ya pertenece a @${numFromJid(dup.jid)} (visto por última vez en ${dup.groupId.split("@")[0]}).`));

  // Actualizar o crear registro globalmente
  // Aunque actualizamos el JID, mantenemos el groupId de donde se asignó por última vez para referencia
  await User.updateOne(
    { jid: objetivo },
    { $set: { personaje: nombre, lastPersoChange: new Date(), groupId: from } },
    { upsert: true }
  );
  console.log(`[RP GLOBAL] Guardado: ${nombre} para ${objetivo} (en ${from})`);

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
