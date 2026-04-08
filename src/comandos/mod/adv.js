// src/comandos/mod/adv.js
// !adv @user [motivo] | !ver adv [@user]
import User from "../../database/models/User.js";
import { aviso, listSection, listItem } from "../../utils/format.js";
import userTarget from "../../utils/userTarget.js";

export const name      = "adv";
export const aliases   = ["warn", "veradv", "veradvs"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

const MAX_ADV    = 3;
const numFromJid = (jid) => jid?.split("@")[0] || jid;

export const run = async (contexto) => {
  const { reply, react, sender, from, args, mentionedJids, isWAAdmin, isMod, isOwner, sock, msg, communityId } = contexto;

  const rawBody = (
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text || ""
  ).trim().toLowerCase();

  const esVer = rawBody.startsWith("!veradv") || rawBody.startsWith("!veradvs") || rawBody.startsWith("!verwarn") || rawBody.startsWith("!ver adv");

  // ── !veradv [@user] — cualquiera puede ver ────────────────────────────────
  if (esVer) {
    const objetivo = await userTarget(contexto, User);
    const u        = await User.findOne({ jid: objetivo, communityId }).lean();
    const nombre   = u?.personaje || numFromJid(objetivo);

    if (!u?.advs?.length)
      return reply(aviso(`*${nombre}* no tiene advertencias.`));

    let txt = `\u200e \u200e \u200e  \u200e \u200e ⤹ ⊹ ୨୧ 𝗔𝗱𝘃𝗲𝗿𝘁𝗲𝗻𝗰𝗶𝗮𝘀 ⿻ ₊˚๑\n`;
    txt +=`                     𝄄 𓈒   ⁺ *${nombre}*   𓏼\n\n`;
    u.advs.forEach((a, i) => {
      const fecha = new Date(a.fecha).toLocaleDateString();
      txt += ` 𝄄➥ *#${i + 1}* _${a.contenido}_ · ${fecha}\n`;
    });
    txt += `\n       𝄄   📊 Total: *${u.advs.length}/${MAX_ADV}*`;
    txt += `\n       𝄄   _Usa *!quitar adv #N @user* para eliminar una específica._`;
    return reply(txt);
  }

  // ── !adv — solo admins WA / Mods / Owners ─────────────────────────────────
  if (!isWAAdmin && !isMod && !isOwner)
    return reply(aviso("Solo Admins del grupo pueden poner advertencias."));

  const targetInfo = await userTarget(contexto, User, true);
  const objetivo   = targetInfo.jid;
  const source     = targetInfo.source;

  if (!objetivo || objetivo === sender) return reply(aviso("Menciona al usuario o escribe su personaje.\n       𝄄   _Uso: !adv @usuario [motivo]_"));

  const dbObj = await User.findOne({ jid: objetivo, communityId }).select("permisos").lean();
  if (dbObj?.permisos === 3) return reply(aviso("No puedes advertir a un Owner."));

  // Extraer el motivo
  let motivo = args.join(" ").trim();
  if (source === "mention" || source === "args") {
    motivo = args.slice(1).join(" ").trim();
  }
  
  if (!motivo) motivo = "Sin motivo";
  const nueva  = { contenido: motivo, autor: sender, fecha: new Date() };

  const actualizado = await User.findOneAndUpdate(
    { jid: objetivo, communityId },
    { $push: { advs: nueva } },
    { upsert: true, new: true }
  ).lean();

  const total  = actualizado?.advs?.length || 1;
  const nombre = actualizado?.personaje || numFromJid(objetivo);

  // ── Auto-kick a 3/3 ───────────────────────────────────────────────────────
  if (total >= MAX_ADV) {
    await reply(
      aviso(`*${nombre}* alcanzó *3/3 advertencias.* Expulsado automáticamente. 🔨`),
      [objetivo]
    );
    await sock.groupParticipantsUpdate(from, [objetivo], "remove").catch(() => {});
    return;
  }

  await react("⚠️");
  await reply(
    aviso(
      `Advertencia *#${total}* registrada a *${nombre}*.\n` +
      `       𝄄   📋 Motivo: _${motivo}_\n` +
      `       𝄄   📊 Total: *${total}/${MAX_ADV}*`
    )
  );
};
