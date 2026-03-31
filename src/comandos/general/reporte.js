// src/comandos/general/reporte.js
import { aviso } from "../../utils/format.js";

export const name      = "reporte";
export const aliases   = ["reportar"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

export const run = async (contexto) => {
  const { reply, react, sender, args, sock, from, meta } = contexto;

  const texto = args.join(" ").trim();
  if (!texto) return reply(aviso("Escribe tu reporte. Ej: `!reporte Usuario X está haciendo...`"));

  // Obtener admins del grupo
  const participants = meta?.participants || [];
  const admins = participants.filter(p => p.admin === "admin" || p.admin === "superadmin").map(p => p.id);

  if (!admins.length) return reply(aviso("No hay administradores en este grupo para reportar."));

  const adminMentions = admins.map(jid => `@${jid.split("@")[0]}`).join(" ");
  
  await sock.sendMessage(from, {
    text: `${adminMentions}\n\n🚨 *REPORTE DE USUARIO*\n\nDe: @${sender.split("@")[0]}\nMotivo: "${texto}"`,
    mentions: [...admins, sender]
  });

  await react("✅");
  await reply(aviso("Reporte enviado a los administradores del grupo."));
};
