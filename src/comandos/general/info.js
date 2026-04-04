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
  
  // Buscar datos del usuario GLOBALMENTE
  let u = await User.findOne({ jid: objetivo }).lean();
  
  // Lógica de autoreparación: Si no existe el usuario pero se solicitó info (o tiene dinero pero no perfil)
  if (!u && objetivo === sender) {
    // Crear perfil básico si el propio usuario usa !info y no existe
    u = await User.findOneAndUpdate(
      { jid: objetivo },
      { 
        $set: { 
          nombre: pushname || "Usuario",
          groupId: from,
          money: 0,
          bank: 0
        } 
      },
      { upsert: true, new: true, lean: true }
    );
  }

  // Si después de intentar reparar sigue sin existir (ej: info @alguien que nunca habló)
  if (!u) {
    const isGlobalOwner = config.OWNERS.includes(objetivo);
    if (!isGlobalOwner) return reply(aviso(`@${numFromJid(objetivo)} no tiene datos registrados todavía.`));
  }
  
  // Verificar si es Owner global (por .env o por permisos: 3)
  const isGlobalOwner = config.OWNERS.includes(objetivo) || (u?.permisos === 3);

  // Verificar si es Admin de WhatsApp en este grupo
  const participant = contexto.meta?.participants?.find(p => p.id === objetivo);
  const isWAAdmin    = participant?.admin === "admin" || participant?.admin === "superadmin";

  let nivelReal = u?.permisos ?? 0;
  if (isGlobalOwner) {
    nivelReal = 3;
  } else if (isWAAdmin) {
    nivelReal = Math.max(nivelReal, 2);
  }

  const rango = RANGO_LABEL[nivelReal] || "👤 Miembro";
  
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
    infoField("Rango",        rango) +
    infoField("Cartera",      `$${cartera.toLocaleString()}`) +
    infoField("Banco",        `$${banco.toLocaleString()}`) +
    infoField("Total",        `$${(cartera + banco).toLocaleString()}`) +
    infoField("Mensajes",     mensajes) +
    infoField("Advertencias", `${advCount}/3`) +
    infoField("Parejas",      parejasStr) +
    `\n\n                     𝄄@𝐀𝗍𝗍𝖾 : ℬeyonder`;

  await reply(txt);
};
