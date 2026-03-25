// src/comandos/mod/cerrar.js
import { aviso } from "../../utils/format.js";

export const name      = "cerrar";
export const aliases   = ["abrir"];
export const onlyAdmin = false;
export const onlyMod   = true;
export const onlyOwner = false;

export const run = async (contexto) => {
  const { reply, react, from, sock, msg } = contexto;

  const rawBody = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || "").trim().toLowerCase();
  const cerrar  = rawBody.startsWith("!cerrar");

  try {
    await sock.groupSettingUpdate(from, cerrar ? "announcement" : "not_announcement");
    await react(cerrar ? "🔒" : "🔓");
    await reply(
      cerrar
        ? aviso("Grupo *cerrado*. 🔒\n       𝄄   _Solo los admins pueden escribir._")
        : aviso("Grupo *abierto*. 🔓\n       𝄄   _Todos pueden escribir nuevamente._")
    );
  } catch (_) {
    await reply(aviso("No pude cambiar la configuración del grupo. ¿Tengo permisos de admin?"));
  }
};
