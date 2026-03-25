// src/comandos/general/reporte.js
// !reporte [texto] | !sugerencia [texto]
import config from "../../config.js";

export const name      = "reporte";
export const aliases   = ["sugerencia", "sugerir", "reportar"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

const numFromJid = (jid) => jid?.split("@")[0] || jid;

export const run = async (contexto) => {
  const { reply, react, sender, args, msg, sock } = contexto;

  const rawBody = (
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text || ""
  ).trim().toLowerCase();

  const isSugerencia = rawBody.startsWith("!sugerencia") || rawBody.startsWith("!sugerir");

  const texto = args.join(" ").trim();
  if (!texto) {
    return reply(
      isSugerencia
        ? "❌ Escribe tu sugerencia. Ej: `!sugerencia Me gustaría que...`"
        : "❌ Escribe tu reporte. Ej: `!reporte Usuario X está haciendo...`"
    );
  }

  const tipo  = isSugerencia ? "💡 Sugerencia" : "🚨 Reporte";
  const emoji = isSugerencia ? "💡" : "🚨";

  await react("✅");
  await reply(
    `  ⤷ ♯ ·  · ${tipo} Recibido.\n\n` +
    `  _"${texto}"_\n\n` +
    `  Se ha notificado al staff. Gracias.`
  );

  const owners = config.OWNERS || [];
  for (const ownerJid of owners) {
    await sock.sendMessage(ownerJid, {
      text:
        `  ♯ ·  · ${tipo} de @${numFromJid(sender)}\n\n` +
        `  _"${texto}"_`,
      mentions: [sender]
    }).catch(() => {});
  }
};
