// src/comandos/mod/nota.js
// !nota @user texto | !historial @user | !quitar nota #N @user
import User from "../../database/models/User.js";
import { aviso, listSection, listItem } from "../../utils/format.js";
import userTarget from "../../utils/userTarget.js";

export const name      = "nota";
export const aliases   = ["historial"];
export const onlyAdmin = false;
export const onlyMod   = true;
export const onlyOwner = false;

const numFromJid = (jid) => jid?.split("@")[0] || jid;
const timeAgo    = (f)   => {
  const d = Math.floor((Date.now() - new Date(f)) / 86_400_000);
  return d > 0 ? `${d}d` : "hoy";
};

export const run = async (contexto) => {
  const { reply, react, sender, msg, args, from, communityId } = contexto;

  const rawBody = (
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text || ""
  ).trim().toLowerCase();

  const targetInfo = await userTarget(contexto, User, true);
  const objetivo   = targetInfo.jid;
  const source     = targetInfo.source;

  if (!objetivo || objetivo === sender) return reply(aviso("Menciona a un usuario o escribe su personaje."));

  // ── !historial @user ───────────────────────────────────────────────────────
  if (rawBody.startsWith("!historial")) {
    const u = await User.findOne({ jid: objetivo, communityId }).lean();
    const nombre = u?.personaje || numFromJid(objetivo);
    if (!u || (!u.notas?.length && !u.advs?.length))
      return reply(aviso(`Sin historial para *${nombre}*.`));

    let txt = `\u200e \u200e \u200e  \u200e \u200e ━━━━━━━━ ꒰ ᧔🗂️᧓ ꒱ ━━━━━━━━\n                     ⤹ ⊹ ୨୧ 𝗛𝗶𝘀𝘁𝗼𝗿𝗶𝗮𝗹 ⿻ ₊˚๑\n     ━━━━━━━━━━━━━━━━━━━━━━━\n`;
    txt += `                     𝄄 𓈒   ⁺ *${nombre}*   𓏼\n\n`;

    if (u.advs?.length) {
      txt += listSection("⚠️ Advertencias");
      u.advs.slice(-3).forEach((a, i) => {
        txt += ` 𝄄➥ *#${i + 1}* _${a.contenido}_ · ${timeAgo(a.fecha)}\n`;
      });
    }
    if (u.notas?.length) {
      txt += "\n" + listSection("📌 Notas");
      u.notas.forEach((n, i) => {
        txt += ` 𝄄➥ *#${i + 1}* _${n.contenido}_ · ${timeAgo(n.fecha)}\n`;
      });
    }
    return reply(txt);
  }

  // ── !nota @user texto ──────────────────────────────────────────────────────
  let texto = args.join(" ").replace(/@\d+/g, "").trim();
  if (source === "args") {
    texto = args.slice(1).join(" ").trim();
  }
  
  if (!texto) return reply(aviso("Escribe el texto de la nota.\n       𝄄   _Uso: !nota @user texto_"));

  const uActual = await User.findOneAndUpdate(
    { jid: objetivo, communityId },
    { $push: { notas: { contenido: texto, autor: sender, fecha: new Date() } } },
    { upsert: true, new: true }
  ).lean();

  const nombreObj = uActual?.personaje || numFromJid(objetivo);
  await react("✅");
  await reply(aviso(`Nota guardada para *${nombreObj}*. 📌`));
};
