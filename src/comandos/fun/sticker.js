// src/comandos/fun/sticker.js
import { downloadMediaMessage } from "@whiskeysockets/baileys";
import { Sticker, StickerTypes } from "wa-sticker-formatter";
import User from "../../database/models/User.js";

export const run = async ({ msg, sock, from, sender, reply, react, isGroup, communityId }) => {
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const q = quoted || msg.message;
  const mime = (q.imageMessage || q.videoMessage || q.stickerMessage)?.mimetype || "";

  if (!/image|video|webp/.test(mime)) {
    return reply("⚠️ Responde a una *imagen* o *video corto* para crear un sticker.");
  }

  // Verificar si es video y no dura más de 10 segundos
  const videoMessage = q.videoMessage;
  if (videoMessage && videoMessage.seconds > 10) {
    return reply("⚠️ El video es demasiado largo. Máximo 10 segundos.");
  }

  await react("⏳");

  try {
    // Descarga Segura: Reintento si el buffer es pequeño
    let buffer;
    
    // Si es respuesta (quoted), descargar el mensaje citado correctamente
    if (quoted) {
      buffer = await downloadMediaMessage(
        { message: quoted },
        "buffer",
        {},
        { re_use: true }
      );
    } else {
      buffer = await downloadMediaMessage(msg, "buffer", {}, { re_use: true });
    }

    if (!buffer || buffer.length < 500) {
      await new Promise((r) => setTimeout(r, 1500));
      if (quoted) {
        buffer = await downloadMediaMessage({ message: quoted }, "buffer", {}, { re_use: true });
      } else {
        buffer = await downloadMediaMessage(msg, "buffer", {}, { re_use: true });
      }
    }

    
    // ── Check de Seguridad ──
    if (!buffer || buffer.length === 0) {
      console.error("❌ Error: El buffer de la imagen llegó vacío al generador.");
      await react("❌");
      return reply("❌ No pude obtener los datos de la imagen. Intenta de nuevo.");
    }

    if (buffer.length < 500) {
      console.warn("⚠️ Advertencia: Buffer muy pequeño, podría estar corrupto.");
    }

    // Identidad Roleplay: Obtener personaje de la base de datos
    const userInDB = await User.findOne({ jid: sender, communityId }).lean();
    const fullIdentity = userInDB?.personaje || userInDB?.nombre || msg.pushName || "Beyonder User";

    const sticker = new Sticker(buffer, {
      pack: "Beyonder v3 Pack",
      author: fullIdentity, // Nombre del Personaje o pushName
      type: StickerTypes.FULL,
      categories: ["🤩", "🎉"],
      id: msg.key.id,
      quality: 70,
    });

    const stickerBuffer = await sticker.toBuffer();
    if (sock && sock.ev) {
      await sock.sendMessage(from, { sticker: stickerBuffer }, { quoted: msg }).catch(e => {
        if (e.message?.includes('Connection Closed')) return;
        throw e;
      });
    }
    await react("✅");

  } catch (error) {
    if (error.message?.includes('Connection Closed')) return;
    console.error("Error creando sticker:", error);
    reply("❌ Error al procesar el sticker.");
    await react("❌");
  }
};

export const name = "sticker";
export const aliases = ["s", "wm"];
export const category = "fun";
export const description = "Convierte imágenes/videos en stickers.";
