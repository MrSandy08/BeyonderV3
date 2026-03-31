// src/comandos/eco/inventory.js
import User from "../../database/models/User.js";

export const name      = "inventory";
export const aliases   = ["inventario", "inv"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

export const run = async (contexto) => {
  const { reply, sender, from } = contexto;

  const user = await User.findOne({ jid: sender, groupId: from }).lean();
  if (!user || !user.inventory) {
    return reply("Inventario vacío.");
  }

  const { minerals, fish } = user.inventory;

  let txt = `MINERALES:\n`;
  txt += `Stone: ${minerals?.stone || 0}\n`;
  txt += `Coal: ${minerals?.coal || 0}\n`;
  txt += `Copper: ${minerals?.copper || 0}\n`;
  txt += `Iron: ${minerals?.iron || 0}\n`;
  txt += `Ruby/Sapphire: ${minerals?.ruby_sapphire || 0}\n`;
  txt += `Diamond: ${minerals?.diamond || 0}\n\n`;

  txt += `PECES:\n`;
  txt += `Common: ${fish?.common || 0}\n`;
  txt += `Puffer: ${fish?.puffer || 0}\n`;
  txt += `Salmon: ${fish?.salmon || 0}\n`;
  txt += `Eel: ${fish?.eel || 0}\n`;
  txt += `Leviathan: ${fish?.leviathan || 0}\n`;
  txt += `Kraken: ${fish?.kraken || 0}`;

  return reply(txt);
};
