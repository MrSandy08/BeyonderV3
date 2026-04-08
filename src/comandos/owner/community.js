// src/comandos/owner/community.js
import Config from "../../database/models/Config.js";
import { aviso } from "../../utils/format.js";

export const name      = "community";
export const aliases   = ["comunidad", "setcomunidad"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = true;

export const run = async (contexto) => {
  const { reply, from, args, isGroup } = contexto;

  if (!isGroup) return reply(aviso("Este comando solo funciona en grupos."));

  const communityId = args[0]?.trim();

  if (!communityId) {
    const cfg = await Config.findOne({ groupId: from }).lean();
    const current = contexto.communityId; // Usamos el ID ya detectado en el contexto
    return reply(aviso(`La comunidad activa de este grupo es: *${current}*\n\nUso: _!community <id_comunidad>_ (Para vinculación manual si no hay comunidad nativa de WhatsApp)`));
  }

  await Config.findOneAndUpdate(
    { groupId: from },
    { $set: { communityId: communityId } },
    { upsert: true }
  );

  return reply(aviso(`✅ Este grupo ha sido vinculado a la comunidad: *${communityId}*`));
};
