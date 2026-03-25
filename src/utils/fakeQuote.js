
/**
 * Crea una estructura de mensaje falso para citar (Quoted Message)
 * Útil para simular que un usuario dijo algo que no dijo o que borró.
 * 
 * @param {string} sender - JID del usuario que supuestamente envió el mensaje
 * @param {string} text - Contenido del mensaje falso
 * @param {string} id - ID opcional del mensaje (por defecto uno aleatorio)
 * @returns {Object} - Estructura de mensaje para usar en options.quoted
 */
export const createFakeQuoted = (sender, text, id = null) => {
  const msgId = id || "BAE5" + Math.random().toString(36).substring(2, 10).toUpperCase();
  
  return {
    key: {
      remoteJid: "0@s.whatsapp.net", // No importa mucho para el quote visual
      fromMe: false,
      id: msgId,
      participant: sender
    },
    message: {
      conversation: text
    }
  };
};

/**
 * Ejemplo de uso en un comando:
 * 
 * import { createFakeQuoted } from "../../utils/fakeQuote.js";
 * 
 * const fake = createFakeQuoted(targetJid, "¡No, yo no dije eso!");
 * await sock.sendMessage(from, { text: "¡Claro que sí lo dijiste!" }, { quoted: fake });
 */
