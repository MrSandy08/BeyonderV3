// src/comandos/general/divorcio.js
import User from "../../database/models/User.js";
import { aviso } from "../../utils/format.js";
import userTarget from "../../utils/userTarget.js";

export const name      = "divorcio";
export const aliases   = ["separar"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

const numFromJid   = (jid) => jid?.split("@")[0] || jid;
const primerNombre = (n)   => n?.split(" ")[0] || n || "???";

export const run = async (contexto) => {
  const { sender, from, sock, msg, args, communityId } = contexto;

  const usuario = await User.findOne({ jid: sender, communityId }).lean();
  if (!usuario?.parejas?.length)
    return sock.sendMessage(from, { text: aviso("No tienes ninguna pareja registrada globalmente. 💔") }, { quoted: msg });

  let targetJid = null;
  if (args.length > 0) {
    const detected = await userTarget(contexto, User);
    if (detected !== sender) targetJid = detected;
  }

  const miNombre  = primerNombre(usuario.personaje || numFromJid(sender));

  if (targetJid) {
    if (!usuario.parejas.includes(targetJid))
      return sock.sendMessage(from, { text: aviso("Ese usuario no es tu pareja."), mentions: [targetJid] }, { quoted: msg });

    await User.findOneAndUpdate({ jid: sender, communityId },    { $pull: { parejas: targetJid } });
    await User.findOneAndUpdate({ jid: targetJid, communityId }, { $pull: { parejas: sender } });

    const exUser   = await User.findOne({ jid: targetJid, communityId }).lean();
    const nombreEx = primerNombre(exUser?.personaje || numFromJid(targetJid));
    return sock.sendMessage(from, {
      text: aviso(`*${miNombre}* se ha divorciado de *${nombreEx}*. 💔`),
      mentions: [sender, targetJid],
    }, { quoted: msg });
  }

  const exIds = [...usuario.parejas];
  for (const exId of exIds) await User.findOneAndUpdate({ jid: exId, communityId }, { $pull: { parejas: sender } });
  await User.findOneAndUpdate({ jid: sender, communityId }, { $set: { parejas: [] } });

  const exNombres = await Promise.all(exIds.map(async id => {
    const u = await User.findOne({ jid: id, communityId }).lean();
    return `*${primerNombre(u?.personaje || numFromJid(id))}*`;
  }));

  await sock.sendMessage(from, {
    text: aviso(`*${miNombre}* y ${exNombres.join(" y ")} se han dicho adiós para siempre. 🍂`),
    mentions: [sender, ...exIds],
  }, { quoted: msg });
};
