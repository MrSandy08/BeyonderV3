// src/comandos/owner/test.js
import { downloadContentFromMessage } from "@whiskeysockets/baileys";
import { analyzeImage } from "../../utils/detector.js";
import { aviso } from "../../utils/format.js";

export const name      = "test";
export const aliases   = ["debug", "analizar"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = true;

export const run = async (contexto) => {
  const { sock, from, msg, react, reply } = contexto;

  // 1. Verificar si hay un mensaje citado con imagen
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  if (!quoted) {
    return reply(aviso("Por favor, *menciona* (quote) una imagen para analizarla."));
  }

  const isImage = quoted.imageMessage;
  if (!isImage) {
    return reply(aviso("El mensaje citado debe ser una *imagen*."));
  }

  try {
    await react("⏳");

    // 2. Descargar la imagen citada
    const stream = await downloadContentFromMessage(isImage, "image");
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }

    // 3. Enviar al detector y obtener resultado
    const result = await analyzeImage(buffer);

    // 4. Responder con el JSON exacto y detalles de depuración
    const jsonStr = JSON.stringify(result, null, 2);
    
    let responseText = `🔍 *DEBUG DETECTOR IA*\n\n`;
    responseText += `\`\`\`json\n${jsonStr}\n\`\`\`\n\n`;

    if (result.error) {
      responseText += `❌ *STACKTRACE / ERROR:*\n`;
      responseText += `_${result.error}_`;
      await react("❌");
    } else {
      const status = (result.isNsfw || result.isGore) ? "🚫 BLOQUEABLE" : "✅ SEGURO";
      responseText += `Estado final: *${status}*\n`;
      responseText += `Estilo: *${result.isAnime ? "Anime" : "Real"}*\n`;
      responseText += `Umbral usado: *${result.threshold}*`;
      await react("✅");
    }

    await reply(responseText);

  } catch (error) {
    console.error("Error en comando !test:", error);
    await react("💥");
    await reply(
      `💥 *ERROR CRÍTICO EN COMANDO:*\n\n` +
      `Mensaje: ${error.message}\n` +
      `Stack:\n\`\`\`\n${error.stack}\n\`\`\``
    );
  }
};
