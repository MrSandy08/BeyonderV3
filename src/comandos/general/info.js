// src/comandos/general/info.js
import User from "../../database/models/User.js";
import { aviso, infoHeader, infoField } from "../../utils/format.js";
import userTarget from "../../utils/userTarget.js";
import config from "../../config.js";

const numFromJid = (jid) => jid?.split("@")[0] || jid;

export const name      = "info";
export const aliases   = ["perfil", "profile", "stats"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

export const run = async (contexto) => {
  const { reply, from, sender, pushname, communityId } = contexto;

  const objetivo = await userTarget(contexto, User);
  console.log(`[DEBUG INFO] Solicitando info para: ${objetivo} (sender: ${sender})`);
  
  // ── Lógica de Comunidad (Unificado por JID + CommunityId) ──
  let u = await User.findOne({ jid: objetivo, communityId }).lean();
  console.log(`[DEBUG INFO] Usuario encontrado en DB: ${u ? u.personaje : 'No existe'}`);

  // Si no existe, lo creamos (Autoreparación)
  if (!u) {
    u = await User.findOneAndUpdate(
      { jid: objetivo, communityId },
      { 
        $setOnInsert: { 
          nombre: pushname || "Usuario",
          money: 0,
          bank: 0,
          msgCount: 0,
          permisos: 0,
          personaje: null,
          groupId: from // Referencia inicial
        } 
      },
      { upsert: true, new: true, lean: true }
    );
  }

  // Determinar Rango Administrativo (WA)
  const participant = contexto.meta?.participants?.find(p => p.id === objetivo);
  const isWAAdmin    = participant?.admin === "admin" || participant?.admin === "superadmin";
  const rangoWA      = isWAAdmin ? "🛡️ Administrador" : "👤 Miembro";

  // Determinar Rango del Bot
  const isGlobalOwner = config.OWNERS.includes(objetivo) || (u.permisos === 3);
  let rangoBot = "👤 Usuario";
  if (isGlobalOwner) {
    rangoBot = "👑 Owner";
  } else if (u.permisos === 2) {
    rangoBot = "🛡️ Moderador";
  } else if (u.permisos === 1) {
    rangoBot = "🤝 Helper";
  }

  const advCount  = (u.advs || []).length;
  const mensajes  = u.msgCount || 0;
  const personaje = u.personaje || "Sin asignar";
  const cartera   = u.money || 0;
  const banco     = u.bank || 0;

  let parejasStr = "Ninguna";
  const parejas = u.parejas || [];
  if (parejas.length) {
    const nombres = await Promise.all(
      parejas.map(async (jid) => {
        const p = await User.findOne({ jid, communityId }).select("personaje").lean();
        return p?.personaje || numFromJid(jid);
      })
    );
    parejasStr = nombres.join(", ");
  }

  const txt =
    infoHeader() +
    infoField("Personaje",    `*${personaje}*`) +
    infoField("Rango Grupo",  rangoWA) +
    infoField("Rango Bot",    rangoBot) +
    infoField("Cartera",      `*$${cartera.toLocaleString()}*`) +
    infoField("Banco",        `*$${banco.toLocaleString()}*`) +
    infoField("Total",        `*$${(cartera + banco).toLocaleString()}*`) +
    infoField("Mensajes",     `*${mensajes}*`) +
    infoField("Advertencias", `*${advCount}/3*`) +
    infoField("Parejas",      `*${parejasStr}*`) +
    `\n\n                     𝄄@𝐀𝗍𝗍𝖾 : ℬeyonder`;

  await reply(txt);
};
