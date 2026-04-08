// src/services/reaccionesService.js
import axios from "axios";

/**
 * Envía una reacción visual (GIF/Sticker) desde Neko.best API.
 */
export async function enviarReaccionNeko(sock, from, type, msg = null, mentions = []) {
    const validReactions = [
        'pat', 'hug', 'cuddle', 'slap', 'poke', 'tickle', 'handshake',
        'smile', 'laugh', 'cry', 'blush', 'sleep', 'shrug', 'bored', 
        'stare', 'think', 'thumbsup'
    ];
    
    const reaction = type.toLowerCase().trim();
    if (!validReactions.includes(reaction)) {
        console.warn(`[REACCIÓN] Tipo no válido solicitado: ${reaction}`);
        return;
    }

    try {
        const res = await axios.get(`https://neko.best/api/v2/${reaction}`);
        const { url } = res.data.results[0];

        await sock.sendMessage(from, { 
            video: { url: url }, 
            gifPlayback: true,
            mentions: mentions
        }, { quoted: msg }).catch(e => console.error("Error enviando GIF Neko:", e.message));

    } catch (err) {
        console.error("❌ [REACCIONES] Error con Neko.best:", err.message);
    }
}
