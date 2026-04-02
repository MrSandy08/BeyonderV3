import { updateYtDlp } from "../../services/youtubeService.js";
import { aviso } from "../../utils/format.js";

export const name      = "ytupdate";
export const aliases   = ["updateyt", "ytdlp-update"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = true;

export const run = async (contexto) => {
  const { reply, react } = contexto;

  await react("⏳");
  const result = await updateYtDlp();

  if (result.success) {
    await react("✅");
    return reply(aviso(result.message));
  } else {
    await react("❌");
    return reply(aviso(`Error al actualizar yt-dlp: ${result.message}`));
  }
};
