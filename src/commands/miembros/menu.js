// src/commands/miembros/menu.js
import { header, category, cmdLine, aviso } from "../../format.js";

export const name      = "menu";
export const aliases   = ["smenu", "pmenu", "ayuda", "help"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

// ══════════════════════════════════════════════════════════════
//  !menu — todos los usuarios
// ══════════════════════════════════════════════════════════════
const MENU_USER = [
header("General Menu"),
category("𝓟ersonajes"),
cmdLine("📋","lista",            "Muestra la lista de personajes con iconos de inactividad."),
cmdLine("⏳","inactivos",        "Filtra y muestra solo los miembros inactivos."),
cmdLine("🔍","pedir [nombre]",   "Añade un personaje a la lista de buscados."),
cmdLine("📖","buscados",         "Muestra la lista de personajes pedidos."),
cmdLine("👤","info [@user]",     "Muestra personaje, rango, advertencias, mensajes y parejas."),
cmdLine("🏆","top10 / top",      "Muestra el ranking de los más activos."),
category("𝓡P Social"),
cmdLine("💌","marry @user",      "Proponer pareja o poliamor."),
cmdLine("💍","lover",            "Ver tu(s) pareja(s) actual(es)."),
cmdLine("🌸","relaciones",       "Ver todas las relaciones del grupo."),
cmdLine("🍂","divorcio [@user]", "Terminar una relación."),
cmdLine("🚢","ship @u1 @u2",     "Shippear a dos personas (o a ti con alguien)."),
cmdLine("👶","adoptar @user",    "Adoptar a alguien como hijo/a."),
cmdLine("🍂","desadoptar @user", "Echar a alguien de tu familia."),
cmdLine("✅","aceptar / rechazar", "Responder a una solicitud (marry, adoptar...)."),
category("𝓖eneral"),
cmdLine("⚡","ping",             "Verificar que el bot está activo."),
cmdLine("🎵","play [nombre]",    "Buscar y descargar música o videos."),
cmdLine("🤖","ia [texto]",       "Chatea con Beyonder (IA)."),
cmdLine("👤","apodo [nick]",     "Cambiar tu apodo en el grupo."),
cmdLine("💡","sugerencia",       "Envía una sugerencia para el bot."),
cmdLine("🚩","reporte",         "Reporta un problema o usuario."),
cmdLine("👁️","ver adv/excusa",   "Ver advertencias o excusas (propio o @user)."),
cmdLine("🎨","sticker / s",      "Convierte imagen/video en sticker."),
category("💰 𝓔conomía"),
cmdLine("🎁","daily / diario",   "Reclama tu bono diario de monedas."),
cmdLine("💼","work / trabajar",  "Trabaja para ganar monedas."),
cmdLine("🍒","slut / puta",      "Intenta ganar monedas con 'trabajo' extra."),
cmdLine("⛏️","minar",           "Extrae minerales valiosos."),
cmdLine("🎣","pescar",          "Intenta pescar un tesoro."),
cmdLine("🏹","cazar",           "Caza animales en el bosque."),
cmdLine("🔫","atracar @user",    "Roba a otro usuario (Riesgo: Cárcel)."),
cmdLine("💸","extorsionar @user", "Extorsión rápida (Riesgo: Cárcel)."),
cmdLine("🤫","robar @user",      "Robo discreto de cartera (Bajo riesgo)."),
cmdLine("🌱","cultivar",        "Planta cultivos para cosechar luego."),
cmdLine("🧺","cosechar",        "Recoge tus cultivos maduros."),
cmdLine("🏛️","impuesto [monto]", "Cobra una cantidad a todos (Staff)."),
cmdLine("🎁","claim / reclamar", "Reclama regalos del chat."),
cmdLine("🏆","ricos",           "Top 10 usuarios más millonarios."),
cmdLine("🕊️","fianza",          "Paga para salir de la cárcel."),
cmdLine("🎰","suerte [monto]",   "Apuesta dinero en el casino."),
cmdLine("🚬","crimen",          "Realiza un acto delictivo (70% éxito)."),
`\n   𝄄   _Usa *!smenu* para ver comandos de Admin/Mod._`,
].join("");

// ══════════════════════════════════════════════════════════════
//  !smenu — Admins y Moderadores
// ══════════════════════════════════════════════════════════════
const MENU_STAFF = [
header("Staff Menu"),
category("🎭 𝓡oleplay"),
cmdLine("🎭","rp @user [nombre]", "Asignar personaje a otro usuario."),
cmdLine("❌","rp quitar @user",   "Quitar personaje a otro usuario."),
category("⚠️ 𝓜oderación"),
cmdLine("⚠️","adv @user [mot.]",  "Poner advertencia (3/3 = kick automático)."),
cmdLine("❌","quitar adv #N",     "Eliminar una advertencia específica por número."),
cmdLine("👁️","veradv [@user]",    "Ver las advertencias de un usuario."),
cmdLine("🚪","kick @user",        "Expulsar a un usuario del grupo."),
cmdLine("🚫","ban @user [mot.]",  "Banear permanentemente de la comunidad."),
cmdLine("✅","unban #N",          "Quitar ban por número de lista."),
cmdLine("📋","lista ban",         "Ver todos los usuarios baneados."),
category("📝 𝓡egistros"),
cmdLine("📌","nota @user texto",  "Añadir una nota a un usuario."),
cmdLine("❌","quitar nota #N",    "Eliminar una nota específica por número."),
cmdLine("🗂️","historial @user",   "Ver notas y advertencias de un usuario."),
cmdLine("📝","excusa [mot.]",     "Registrar una ausencia propia."),
cmdLine("👁️","ver excusa [@user]", "Ver la excusa activa de alguien."),
cmdLine("📋","ver excusas",        "Ver todas las excusas activas del grupo."),
cmdLine("🗑️","reset advs/notas",  "Resetear todas las advs o notas de alguien."),
category("🔐 𝓢eguridad"),
cmdLine("🔗","antilink on/off",   "Elimina links de otros grupos + Advertencia."),
cmdLine("🔞","antiporn on/off",   "Elimina links de sitios X + Advertencia."),
cmdLine("🔞","antinsfw on/off",   "IA: Escanea imágenes buscando desnudez."),
cmdLine("🩸","antigore on/off",   "IA: Escanea imágenes buscando sangre/gore."),
cmdLine("🧪","antifiltro",        "Atajo para configurar filtros IA."),
cmdLine("🌊","antiflood on/off",  "Activa/desactiva cierre por flood."),
category("🔧 𝓖rupo"),
cmdLine("🗝️","cerrar / abrir",    "Cerrar o abrir el grupo."),
cmdLine("🎖️","promover / degradar @user", "Cambiar el rango de un usuario (0-2)."),
`\n   𝄄   _Usa *!pmenu* para ver comandos de Owner._`,
].join("");

// ══════════════════════════════════════════════════════════════
//  !pmenu — solo Owner
// ══════════════════════════════════════════════════════════════
const MENU_OWNER = [
header("Owner Menu"),
category("⚙️ 𝓒onfiguración"),
cmdLine("🏠","set principal",     "Marca este grupo como el principal (bienvenidas, logs)."),
cmdLine("🔁","set secundaria",    "Marca este grupo como secundario (listas, backup)."),
cmdLine("✅","beyonder on/off",   "Encender o apagar el bot globalmente."),
cmdLine("🏆","claim",             "Reclamar propiedad del bot en un grupo."),
cmdLine("💥","nuke [pass]",       "Elimina todos los datos del grupo en MongoDB."),
category("👥 𝓡angos"),
cmdLine("🛡️","mod @user",        "Dar rango Moderador a un admin de WA."),
cmdLine("❌","desmod @user",     "Quitar el rango Moderador."),
cmdLine("👑","owners",            "Ver la lista de owners registrados."),
cmdLine("➕","addowner @user",    "Registrar un nuevo Owner."),
cmdLine("❌","removeowner @user", "Quitar el rango Owner a alguien."),
category("🔐 𝓛ocks"),
cmdLine("🔒","lock [target/all]", "Congela ajustes para Moderadores."),
cmdLine("🔓","unlock [target/all]", "Libera ajustes para Moderadores."),
category("🧪 𝓢istema"),
cmdLine("⚡","ping",              "Prueba de latencia del Owner."),
cmdLine("🧪","test",              "Comando de pruebas técnicas."),
`   𝄄   _Targets: rp, antilink, antiporn, antinsfw, antigore, antiflood._`,
].join("");

// ══════════════════════════════════════════════════════════════

export const run = async (contexto) => {
  const { reply, args, msg, isWAAdmin, isMod, isOwner } = contexto;

  const rawBody = (
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text || ""
  ).trim().toLowerCase();

  if (rawBody.startsWith("!smenu")) {
    if (!isWAAdmin && !isMod && !isOwner)
      return reply(aviso("Este menú es solo para Admins y Moderadores."));
    return reply(MENU_STAFF);
  }
  if (rawBody.startsWith("!pmenu")) {
    if (!isOwner)
      return reply(aviso("Este menú es exclusivo para Owners."));
    return reply(MENU_OWNER);
  }
  return reply(MENU_USER);
};
