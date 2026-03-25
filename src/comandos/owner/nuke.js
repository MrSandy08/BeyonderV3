// src/comandos/owner/nuke.js
import User     from "../../database/models/User.js";
import Config   from "../../database/models/Config.js";
import BanList  from "../../database/models/BanList.js";
import Buscados from "../../database/models/Buscados.js";
import { aviso } from "../../utils/format.js";

export const name      = "nuke";
export const aliases   = [];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = true;

const NUKE_PASSWORD = process.env.NUKE_PASSWORD || process.env.OWNER_PASSWORD || "RY18VC";

export const run = async (contexto) => {
  const { reply, react, args, sock, from, msg } = contexto;

  await sock.sendMessage(from, { delete: msg.key }).catch(() => {});

  const pass = args[0]?.trim();
  if (!pass || pass !== NUKE_PASSWORD) { await react("🚫"); return; }

  await react("⏳");
  try {
    const [users, , bans, buscados] = await Promise.all([
      User.deleteMany({}),
      Config.deleteOne({ groupId: from }),
      BanList.deleteMany({}),
      Buscados.deleteMany({}),
    ]);
    await reply(
      aviso(
        `*NUKE ejecutado.* 💥\n` +
        `       𝄄   🗑️ Usuarios: *${users.deletedCount}* eliminados\n` +
        `       𝄄   🗑️ Bans: *${bans.deletedCount}* eliminados\n` +
        `       𝄄   🗑️ Pedidos: *${buscados.deletedCount}* eliminados\n` +
        `       𝄄   🗑️ Config del grupo: *eliminada*`
      )
    );
  } catch (err) {
    await reply(aviso(`Error durante el NUKE: ${err.message}`));
  }
};
