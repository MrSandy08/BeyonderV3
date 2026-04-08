// src/comandos/mod/promover.js
import User from "../../database/models/User.js";
import { aviso } from "../../utils/format.js";
import userTarget from "../../utils/userTarget.js";

export const name      = "promover";
export const aliases   = ["degradar"];
export const onlyAdmin = false;
export const onlyMod   = true;
export const onlyOwner = false;

const NIVEL_LABELS = { 0: "👤 Miembro", 1: "⭐ Helper", 2: "🛡️ Moderador", 3: "👑 Owner" };
const numFromJid   = (jid) => jid?.split("@")[0] || jid;

export const run = async (contexto) => {
  const { reply, react, args, msg, from, sock, communityId } = contexto;

  const rawText = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || "").trim().toLowerCase();
  const isDegrada = rawText.startsWith("!degradar");
  
  const objetivo = await userTarget(contexto, User);

  if (!objetivo) return reply(aviso("Menciona a un usuario o escribe su personaje.\n       𝄄   _!promover @user <nivel>_ o _!degradar @user_"));

  const antes      = await User.findOne({ jid: objetivo, communityId }).select("permisos personaje nombre").lean();
  
  // Verificar si es Owner global (por .env o permisos: 3 en cualquier grupo)
  const isGlobalOwner = contexto.config.OWNERS.includes(objetivo) || 
                        (await User.findOne({ jid: objetivo, communityId, permisos: 3 }).lean());

  if (isGlobalOwner) return reply(aviso("No puedes modificar el rango de un Owner."));

  const nivelAntes = antes?.permisos ?? 0;

  let nuevoNivel;
  if (isDegrada) {
    nuevoNivel = Math.max(0, nivelAntes - 1);
    // Quitar admin en WhatsApp si se degrada a nivel 0
    if (nuevoNivel === 0) {
      await sock.groupParticipantsUpdate(from, [objetivo], "demote").catch(() => {});
    }
  } else {
    nuevoNivel = parseInt(args[1]);
    if (isNaN(nuevoNivel) || nuevoNivel < 0 || nuevoNivel > 3)
      return reply(aviso("El nivel debe ser entre *0* y *3*.\n       𝄄   _0=Miembro · 1=Helper · 2=Mod · 3=Owner_"));
    
    if (nuevoNivel === 3)
      return reply(aviso("No puedes asignar *Owner* desde este comando.\n       𝄄   _Usa !claim con la contraseña._"));

    // Dar admin en WhatsApp si se promueve a nivel 2 o superior
    if (nuevoNivel >= 2) {
      await sock.groupParticipantsUpdate(from, [objetivo], "promote").catch(() => {});
    }
  }

  if (nuevoNivel === nivelAntes) return reply(aviso(`*@${numFromJid(objetivo)}* ya es *${NIVEL_LABELS[nuevoNivel]}*.`), [objetivo]);

  // Actualizar permisos globalmente
  await User.findOneAndUpdate({ jid: objetivo, communityId }, { $set: { permisos: nuevoNivel, groupId: from } }, { upsert: true });

  const nombre = antes?.personaje || antes?.nombre || `@${numFromJid(objetivo)}`;
  await react("✅");
  await reply(
    aviso(
      `Rango actualizado para *${nombre}*.\n` +
      `       𝄄   🔁 Antes: ${NIVEL_LABELS[nivelAntes]}\n` +
      `       𝄄   🆕 Ahora: *${NIVEL_LABELS[nuevoNivel]}*`
    ),
    [objetivo]
  );
};
