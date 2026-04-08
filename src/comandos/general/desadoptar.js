// src/comandos/general/desadoptar.js
import User from "../../database/models/User.js";
import { aviso } from "../../utils/format.js";
import userTarget from "../../utils/userTarget.js";

export const name      = "desadoptar";
export const aliases   = ["disinherit", "echar", "desheredar"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

const numFromJid   = (jid) => jid?.split("@")[0] || jid;
const primerNombre = (n)   => n?.split(" ")[0] || n || "???";

export const run = async (contexto) => {
  const { reply, sender, from, args, communityId } = contexto;

  // Detectar objetivo: mención o personaje
  let targets = (contexto.mentionedJids || []).filter(j => j !== sender);
  
  if (!targets.length && args.length > 0) {
    const targetPj = await userTarget(contexto, User);
    if (targetPj && targetPj !== sender) {
      targets = [targetPj];
    }
  }

  if (!targets.length) return reply(aviso("Menciona a quien quieres desadoptar o escribe su personaje.\n       𝄄   _!desadoptar @usuario_ o _!desadoptar Personaje_"));

  const targetId = targets[0];
  const miUsuario = await User.findOne({ jid: sender, communityId });
  if (!miUsuario?.kinship?.children?.includes(targetId))
    return reply(aviso(`@${numFromJid(targetId)} no es tu hijo/a.`));

  // Actualizar ambos globalmente
  await User.findOneAndUpdate({ jid: sender, communityId }, { $pull: { "kinship.children": targetId } });
  await User.findOneAndUpdate({ jid: targetId, communityId }, { $set: { "kinship.parent": null } });

  const targetUsuario = await User.findOne({ jid: targetId, communityId }).lean();
  const cNombre = primerNombre(targetUsuario?.personaje || numFromJid(targetId));

  return reply(aviso(`💔 *DESADOPTADO*\n\nHas expulsado a *${cNombre}* de tu linaje. Ya no tiene familia. 🥀`));
};
