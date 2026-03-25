// src/comandos/mod/ban.js
// !ban @user [motivo] | !unban #N | !lista ban
import BanList from "../../database/models/BanList.js";
import { aviso, listSection, listItem } from "../../utils/format.js";

export const name      = "ban";
export const aliases   = ["unban", "listaban"];
export const onlyAdmin = false;
export const onlyMod   = true;
export const onlyOwner = false;

const numFromJid = (jid) => jid?.split("@")[0] || jid;

export const run = async (contexto) => {
  const { reply, react, sender, from, args, mentionedJids, sock, msg } = contexto;

  const rawBody = (
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text || ""
  ).trim().toLowerCase();

  // ── !lista ban ─────────────────────────────────────────────────────────────
  if (rawBody === "!lista ban" || rawBody === "!listaban") {
    const lista = await BanList.find({}).lean();
    if (!lista.length) return reply(aviso("✅ La lista de baneados está vacía."));

    let txt = `\u200e \u200e \u200e  \u200e \u200e ━━━━━━━━ ꒰ ᧔🚫᧓ ꒱ ━━━━━━━━\n                     ⤹ ⊹ ୨୧ 𝗟𝗶𝘀𝘁𝗮 𝗕𝗮𝗻 ⿻ ₊˚๑\n     ━━━━━━━━━━━━━━━━━━━━━━━\n`;
    txt += listSection("𝓑aneados");
    lista.forEach((b, i) => {
      txt += listItem(`*#${i + 1}* *+${b.numero || numFromJid(b.jid)}*`) + "\n";
      txt += `       𝄄   📋 _${b.motivo}_ · ${new Date(b.fecha).toLocaleDateString()}\n`;
    });
    txt += `\n       𝄄   _Usa *!unban #N* para quitar un ban._`;
    return reply(txt);
  }

  // ── !unban #N ──────────────────────────────────────────────────────────────
  if (rawBody.startsWith("!unban")) {
    const n = parseInt(args[0]?.replace("#", ""));
    if (isNaN(n) || n < 1)
      return reply(aviso("Usa *!lista ban* para ver los números.\n       𝄄   _Uso: !unban #N_"));

    const lista = await BanList.find({}).lean();
    const entry = lista[n - 1];
    if (!entry) return reply(aviso(`No existe el ban *#${n}*.`));

    await BanList.deleteOne({ _id: entry._id });
    await react("✅");
    return reply(aviso(`*+${entry.numero || numFromJid(entry.jid)}* removido de la banlist. ✅`));
  }

  // ── !ban @user [motivo] ────────────────────────────────────────────────────
  const objetivo = mentionedJids?.[0];
  if (!objetivo)
    return reply(aviso("Menciona al usuario que quieres banear.\n       𝄄   _Uso: !ban @usuario [motivo]_"));
  if (objetivo === sender)
    return reply(aviso("No puedes banearte a ti mismo."));

  const yaExiste = await BanList.findOne({ jid: objetivo }).lean();
  if (yaExiste)
    return reply(aviso(`@${numFromJid(objetivo)} ya está en la banlist.`), [objetivo]);

  const motivo = args.slice(1).join(" ").trim() || "Sin motivo";
  await BanList.create({ jid: objetivo, numero: numFromJid(objetivo), motivo, bannadoPor: sender });

  // Expulsar si está en el grupo
  try { await sock.groupParticipantsUpdate(from, [objetivo], "remove"); } catch (_) {}

  await react("🚫");
  await reply(
    aviso(
      `*@${numFromJid(objetivo)}* baneado permanentemente. 🚫\n` +
      `       𝄄   📋 Motivo: _${motivo}_\n` +
      `       𝄄   _Usa *!lista ban* para ver todos los baneados._`
    ),
    [objetivo]
  );
};
