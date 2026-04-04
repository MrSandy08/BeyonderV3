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
  const { reply, from, sender, pushname } = contexto;

  const objetivo = await userTarget(contexto, User);
  
  // Buscar datos del usuario GLOBALMENTE y Autoreparar
  const u = await User.findOneAndUpdate(
    { jid: objetivo },
    { 
      $setOnInsert: { 
        nombre: pushname || "Usuario",
        personaje: null,
        money: 0,
        bank: 0,
        msgCount: 0,
        permisos: 0,
        lastDaily: new Date(0)
      } 
    },
    { upsert: true, new: true, lean: true }
  );

  // Determinar Rango Administrativo (WA)
  const participant = contexto.meta?.participants?.find(p => p.id === objetivo);
  const isWAAdmin    = participant?.admin === "admin" || participant?.admin === "superadmin";
  const rangoWA      = isWAAdmin ? "🛡️ Administrador" : "👤 Miembro";

  // Determinar Rango del Bot (Bot Permisos / Lista Blanca)
  const isGlobalOwner = config.OWNERS.includes(objetivo) || (u?.permisos === 3);
  let rangoBot = "👤 Usuario";
  if (isGlobalOwner) {
    rangoBot = "👑 Owner";
  } else if (u?.permisos === 2) {
    rangoBot = "🛡️ Moderador";
  } else if (u?.permisos === 1) {
    rangoBot = "🤝 Helper";
  }

  const advCount  = u?.advs?.length  || 0;
  const mensajes  = u?.msgCount      || 0;
  const personaje = u?.personaje     || "Sin asignar";
  const cartera   = u?.money         || 0;
  const banco     = u?.bank          || 0;

  let parejasStr = "Ninguna";
  if (u?.parejas?.length) {
    const nombres = await Promise.all(
      u.parejas.map(async (jid) => {
        const p = await User.findOne({ jid }).select("personaje").lean();
        return p?.personaje || numFromJid(jid);
      })
    );
    parejasStr = nombres.join(", ");
  }

  const txt =
    infoHeader() +
    infoField("Personaje",    personaje) +
    infoField("Rango Grupo",  rangoWA) +
    infoField("Rango Bot",    rangoBot) +
    infoField("Cartera",      `$${cartera.toLocaleString()}`) +
    infoField("Banco",        `$${banco.toLocaleString()}`) +
    infoField("Total",        `$${(cartera + banco).toLocaleString()}`) +
    infoField("Mensajes",     mensajes) +
    infoField("Advertencias", `${advCount}/3`) +
    infoField("Parejas",      parejasStr) +
    `\n\n                     𝄄@𝐀𝗍𝗍𝖾 : ℬeyonder`;

  await reply(txt);
};
