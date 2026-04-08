// src/comandos/owner/removeowner.js
import User from "../../database/models/User.js";
import { aviso } from "../../utils/format.js";
import userTarget from "../../utils/userTarget.js";

export const name      = "removeowner";
export const aliases   = ["quitarowner", "ro"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = true;

const numFromJid = (jid) => jid?.split("@")[0] || jid;

export const run = async (contexto) => {
  const { sender, reply, react, communityId } = contexto;

  const objetivo = await userTarget(contexto, User);
  if (!objetivo || objetivo === sender) return reply(aviso("Menciona al owner o escribe su personaje que deseas remover."));

  await User.updateMany({ jid: objetivo, communityId }, { $set: { permisos: 0 } });
  await react("✅");
  await reply(aviso(`*@${numFromJid(objetivo)}* ya no es Owner.`), [objetivo]);
};
