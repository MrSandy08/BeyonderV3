// src/comandos/fun/pback.js
import User from "../../database/models/User.js";
import userTarget from "../../utils/userTarget.js";

export const name      = "pback";
export const aliases   = ["piggyback", "arre"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

const primerNombre = (n)   => n?.split(" ")[0] || n || "???";

export const run = async (contexto) => {
  const { reply, sender, from, args } = contexto;

  // Detectar objetivo: mención o personaje
  let targets = (contexto.mentionedJids || []).filter(j => j !== sender);
  
  if (!targets.length && args.length > 0) {
    const targetPj = await userTarget(contexto, User);
    if (targetPj && targetPj !== sender) {
      targets = [targetPj];
    }
  }

  if (!targets.length) return reply("⚠️ Menciona a alguien para subirte a su espalda.");

  const targetId = targets[0];
  const u1 = await User.findOne({ jid: sender, groupId: from }).lean();
  const u2 = await User.findOne({ jid: targetId, groupId: from }).lean();

  const n1 = primerNombre(u1?.personaje || contexto.msg.pushName);
  const n2 = primerNombre(u2?.personaje || "Usuario");

  return reply(`¡*${n1}* se ha subido a la espalda de *${n2}*! ¡Arre! 🐎`);
};
