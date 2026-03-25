
import ytSearch from "yt-search";
import { searches } from "../../store/searches.js";
import { aviso } from "../../utils/format.js";

export const name      = "play";
export const aliases   = ["music", "video", "v", "audio"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

export const run = async (contexto) => {
  const { reply, args, from, sender, msg } = contexto;

  const rawBody = (
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text || ""
  ).trim().toLowerCase();

  const isVideo = rawBody.startsWith("!video") || rawBody.startsWith("!v");
  const type = isVideo ? "video" : "audio";

  const query = args.join(" ").trim();
  if (!query) {
    return reply(aviso(`Escribe el nombre de la canción o video.\n       𝄄   _Ej: !play Imagine Dragons Believer_`));
  }

  try {
    const search = await ytSearch(query);
    const results = search.videos.slice(0, 5);

    if (!results.length) {
      return reply(aviso("No se encontraron resultados para tu búsqueda."));
    }

    let txt = `   ⤷ ゛🎵  ˎˊ˗\n  ♯ ·  · *Resultados para:* _${query}_\n\n`;
    results.forEach((v, i) => {
      txt += `  *${i + 1}.* ${v.title}\n      𝄄  ⏱️ ${v.duration.timestamp} · 👁️ ${v.views.toLocaleString()}\n\n`;
    });
    txt += `  𝄄   _Responde con el *número* de la opción para descargar._\n`;
    txt += `  𝄄   _Formato actual: *${type.toUpperCase()}*_`;

    // Almacenar resultados para la selección interactiva
    const key = `${from}:${sender}`;
    
    // Limpiar búsqueda anterior si existe
    if (searches.has(key)) {
      clearTimeout(searches.get(key).timer);
    }

    const timer = setTimeout(() => {
      searches.delete(key);
    }, 60000); // 1 minuto de expiración

    searches.set(key, { results, type, timer });

    await reply(txt);
  } catch (error) {
    console.error("Error en !play search:", error);
    reply(aviso("Ocurrió un error al buscar en YouTube."));
  }
};
