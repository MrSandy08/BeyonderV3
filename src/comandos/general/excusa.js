// src/comandos/general/excusa.js
// !excusa [motivo] [Nd] | !excusa off | !verexcusa @tag | !verexcusas
import User from "../../database/models/User.js";
import userTarget from "../../utils/userTarget.js";

export const name      = "excusa";
export const aliases   = ["verexcusa", "verexcusas"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

const numFromJid = (jid) => jid?.split("@")[0] || jid;

export const run = async (contexto) => {
  const { reply, react, sender, mentionedJids, args, msg, isWAAdmin, isOwner, sock, from } = contexto;

  const rawBody = (
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text || ""
  ).trim().toLowerCase();

  // ── !verexcusas — solo admins ─────────────────────────────────────────────
  if (rawBody === "!verexcusas" || rawBody.startsWith("!ver excusas")) {
    if (!isWAAdmin && !isOwner) {
      return reply("⛔ Solo admins pueden ver todas las excusas.");
    }
    const lista = await User.find({ groupId: from, "afk.activa": true, "afk.motivo": { $ne: null } }).lean();
    if (!lista.length) return reply("Sin excusas activas en este grupo.");

    let txt = "⤷ ゛📝  ˎˊ˗\n♯ ·  · Excusas Activas  ่  ·  ▧\n\n";
    lista.forEach((u) => {
      const label = u.personaje ? `*${u.personaje}*` : numFromJid(u.jid);
      txt += `• ${label}: _${u.afk.motivo}_\n`;
    });
    return reply(txt);
  }

  // ── !verexcusa @tag ───────────────────────────────────────────────────────
  if (rawBody.startsWith("!verexcusa") || rawBody.startsWith("!ver excusa")) {
    const objetivo = await userTarget(contexto, User);
    if (!objetivo) return reply("⚠️ Menciona a alguien o escribe su personaje para ver su excusa.");
    const u     = await User.findOne({ jid: objetivo, groupId: from }).lean();
    const label = u?.personaje ? `*${u.personaje}*` : numFromJid(objetivo);
    if (!u?.afk?.activa || !u?.afk?.motivo) return reply(`ℹ️ *${label}* sin excusa activa en este grupo.`);
    return reply(`📝 *Excusa de ${label}:*\n_${u.afk.motivo}_`);
  }

  // ── !excusa off ───────────────────────────────────────────────────────────
  if (rawBody.startsWith("!excusa off")) {
    const puedeOtros = isWAAdmin || isOwner;
    const argsTarget = args.filter(a => a.toLowerCase() !== "off");
    const objetivo   = puedeOtros ? await userTarget({ ...contexto, args: argsTarget }, User) : sender;
    const u          = await User.findOneAndUpdate({ jid: objetivo, groupId: from }, { $set: { "afk.activa": false, "afk.motivo": null, "afk.fechaExpira": null } }).lean();
    const nombre     = u?.personaje || numFromJid(objetivo);

    await react("✅");
    return reply(
      `  ⤷ ゛🗞️  ˎˊ˗\n  ♯ ·  · Excusa borrada.\n  _Ya no hay excusa para *${nombre}*._`
    );
  }

  // ── !excusa [motivo] [Nd] — cualquiera puede ponerse su propia excusa ─────
  const objetivo = sender; // Por defecto siempre es el propio usuario para evitar abusos

  let motivoRaw = args.join(" ").replace(/@\d+/g, "").trim();
  if (!motivoRaw) return reply("❌ Escribe el motivo.\n\n📌 Ej: `!excusa viaje` o `!excusa viaje 14d`");

  let dias = 7;
  const durMatch = motivoRaw.match(/(\d+)d$/i);
  if (durMatch) {
    dias      = Math.min(30, Math.max(1, parseInt(durMatch[1])));
    motivoRaw = motivoRaw.slice(0, -durMatch[0].length).trim();
  }

  const fechaExpira = new Date(Date.now() + dias * 24 * 60 * 60 * 1000);
  const uActualizado = await User.findOneAndUpdate(
    { jid: objetivo, groupId: from },
    { $set: { afk: { motivo: motivoRaw, fechaExpira, activa: true } } },
    { upsert: true, new: true }
  ).lean();

  const nombreExcusa = uActualizado?.personaje || numFromJid(objetivo);
  await react("✅");
  await reply(`✅ Excusa de *${nombreExcusa}* guardada. _Caduca en ${dias} día(s)._`);
};
