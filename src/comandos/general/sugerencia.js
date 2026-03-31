// src/comandos/general/sugerencia.js
import Suggestion from "../../database/models/Suggestion.js";
import Config from "../../database/models/Config.js";
import { aviso } from "../../utils/format.js";

export const name      = "sugerencia";
export const aliases   = ["sugerencias", "sugerir"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

export const run = async (contexto) => {
  const { reply, react, sender, args, msg, sock, from } = contexto;

  const command = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";
  const isList = command.toLowerCase().startsWith("!sugerencias");

  if (isList) {
    const lista = await Suggestion.find({}).sort({ timestamp: -1 }).lean();
    if (!lista.length) return reply(aviso("No hay sugerencias guardadas."));

    let txt = `💡 *LISTA DE SUGERENCIAS*\n\n`;
    lista.forEach((s, i) => {
      txt += `*#${i + 1}* | @${s.user.split("@")[0]}\n`;
      txt += `   - _"${s.text}"_\n`;
      txt += `   - Estado: ${s.status}\n\n`;
    });
    return reply(txt, lista.map(s => s.user));
  }

  const texto = args.join(" ").trim();
  if (!texto) return reply(aviso("Escribe tu sugerencia. Ej: `!sugerencia Me gustaría que...`"));

  // Guardar en DB
  await Suggestion.create({
    user: sender,
    text: texto,
  });

  // Enviar al grupo secundario
  const cfgSec = await Config.findOne({ esSecundaria: true }).lean();
  if (cfgSec) {
    await sock.sendMessage(cfgSec.groupId, {
      text: `💡 *NUEVA SUGERENCIA*\n\nDe: @${sender.split("@")[0]}\n\n"${texto}"`,
      mentions: [sender]
    });
  }

  await react("✅");
  await reply(aviso("Sugerencia recibida y guardada. ¡Gracias!"));
};
