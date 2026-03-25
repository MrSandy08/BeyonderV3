// src/comandos/general/info.js
import User from "../../database/models/User.js";
import config from "../../config.js";
import { infoHeader, infoField, aviso } from "../../utils/format.js";
import userTarget from "../../utils/userTarget.js";

export const name      = "info";
export const aliases   = ["perfil"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

const numFromJid = (jid) => jid?.split("@")[0] || jid;

const RANGO_LABEL = {
  0: "Miembro",
  1: "Helper",
  2: "Moderador",
  3: "Owner",
};

export const run = async (contexto) => {
  const { reply, from } = contexto;

  const objetivo = await userTarget(contexto, User);
  
  // Buscar datos del usuario en el grupo actual
  const u = await User.findOne({ jid: objetivo, groupId: from }).lean();
  
  // Verificar si es Owner global (por .env o por permisos: 3 en cualquier grupo)
  const isGlobalOwner = config.OWNERS.includes(objetivo) || 
                        (await User.findOne({ jid: objetivo, permisos: 3 }).lean());

  // Verificar si es Admin de WhatsApp en este grupo
  const participant = contexto.meta?.participants?.find(p => p.id === objetivo);
  const isWAAdmin    = participant?.admin === "admin" || participant?.admin === "superadmin";

  let nivelReal = u?.permisos ?? 0;
  if (isGlobalOwner) {
    nivelReal = 3;
  } else if (isWAAdmin) {
    // Si es admin de WA, al menos es Moderador (nivel 2)
    nivelReal = Math.max(nivelReal, 2);
  }

  const rango = RANGO_LABEL[nivelReal] || "👤 Miembro";
  
  if (!u && !isGlobalOwner) return reply(aviso(`@${numFromJid(objetivo)} no tiene datos registrados todavía en este grupo.`));

  const advCount  = u?.advs?.length  || 0;
  const mensajes  = u?.msgCount      || 0;
  const personaje = u?.personaje     || "Sin asignar";

  let parejasStr = "Ninguna";
  if (u?.parejas?.length) {
    const nombres = await Promise.all(
      u.parejas.map(async (jid) => {
        const p = await User.findOne({ jid, groupId: from }).select("personaje").lean();
        return p?.personaje || numFromJid(jid);
      })
    );
    parejasStr = nombres.join(", ");
  }

  const txt =
    infoHeader() +
    infoField("Personaje",    personaje) +
    infoField("Rango",        rango) +
    infoField("Advertencias", `${advCount}/3`) +
    infoField("Mensajes",     mensajes) +
    infoField("Parejas",      parejasStr) +
    `\n\n                     𝄄@𝐀𝗍𝗍𝖾 : ℬeyonder`;

  await reply(txt);
};
