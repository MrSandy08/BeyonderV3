// src/comandos/general/info.js
import UserClass from "../../classes/User.js";
import UserSchema from "../../database/models/User.js";
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

  const objetivo = await userTarget(contexto, UserSchema);
  console.log(`[DEBUG INFO] Solicitando info para: ${objetivo} (sender: ${sender})`);
  
  // ── Beyonder v4: Usar Clase de Usuario ──
  const u = await UserClass.findOrCreate(objetivo, communityId, {
    nombre: pushname || "Usuario",
    money: 0,
    bank: 0,
    msgCount: 0,
    permisos: 0,
    personaje: null,
    groupId: from
  });

  if (!u) {
    return reply("❌ Error al procesar el perfil en la base de datos.");
  }

  // Determinar Rango Administrativo (WA)
  const participant = contexto.meta?.participants?.find(p => p.id === objetivo);
  const isWAAdmin    = participant?.admin === "admin" || participant?.admin === "superadmin";
  const rangoWA      = isWAAdmin ? "🛡️ Administrador" : "👤 Miembro";

  // Determinar Rango del Bot usando métodos de clase
  const isGlobalOwner = u.isOwner(config.OWNERS);
  let rangoBot = "👤 Usuario";
  if (isGlobalOwner) {
    rangoBot = "👑 Owner";
  } else if (u.isMod()) {
    rangoBot = "🛡️ Moderador";
  } else if (u.isHelper()) {
    rangoBot = "🤝 Helper";
  }

  // Obtener estadísticas usando método de clase
  const stats = u.getStats();
  const personaje = u.getPersonaje();

  let parejasStr = "Ninguna";
  const parejas = u.data.parejas || [];
  if (parejas.length) {
    const nombres = await Promise.all(
      parejas.map(async (jid) => {
        const p = await UserSchema.findOne({ jid, communityId }).select("personaje").lean();
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
    infoField("Cartera",      `*$${stats.money.toLocaleString()}*`) +
    infoField("Banco",        `*$${stats.bank.toLocaleString()}*`) +
    infoField("Total",        `*$${stats.total.toLocaleString()}*`) +
    infoField("Mensajes",     `*${stats.msgCount}*`) +
    infoField("Advertencias", `*${stats.advCount}/3*`) +
    infoField("Parejas",      `*${parejasStr}*`) +
    `\n\n                     𝄄@𝐀𝗍𝗍𝖾 : ℬeyonder`;

  await reply(txt);
};
