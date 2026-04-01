// src/rpg/rpgEngine.js
import Player from "./models/Player.js";
import GroupRPG from "./models/GroupRPG.js";
import GlobalItem from "./models/GlobalItem.js";
import { groupOnly } from "./middlewares/groupOnly.js";
import { startAdventure, getScene, resolveChoice, spawnEncounter } from "./services/storyEngine.js";
import { renderInventory, renderProfile } from "./services/renderEngine.js";
import { attackTarget, startDuel } from "./services/combatEngine.js";
import { loadFonts } from "./utils/fontLoader.js";
import { aviso } from "../../utils/format.js";

// Inicializar fuentes para Canvas
loadFonts();

/**
 * Registra y maneja los comandos del sistema Beyonder RPG.
 * Se integra dentro del switch(command) principal o se exporta como comandos individuales.
 */
export const name      = "adventure";
export const aliases   = ["me", "bag", "stats", "attack", "skill", "defend", "flee", "duel", "accept", "take", "drop", "equip", "use", "give", "shop", "buy", "sell", "talk", "travel", "rest", "log"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

export const run = async (contexto) => {
  const { reply, sock, from, sender, command, args, text, mentionedJids } = contexto;

  // ── Middleware: Solo Grupos ──
  if (!(await groupOnly(contexto))) return;

  try {
    switch (command) {
      case "adventure":
        // Iniciar aventura
        let player = await Player.findOne({ userId: sender, groupId: from });
        if (!player) {
          player = await Player.create({ 
            userId: sender, 
            groupId: from, 
            name: contexto.msg.pushName || "Aventurero" 
          });
        }
        await startAdventure(from);
        const scene = await getScene(from);
        return reply(`⚔️ *BEYONDER RPG: INICIO DE AVENTURA*\n\n` + scene);

      case "me":
      case "stats":
        // Ver perfil visual
        const pMe = await Player.findOne({ userId: sender, groupId: from });
        if (!pMe) return reply(aviso("No tienes un perfil de aventurero. Usa !adventure"));
        const profileBuffer = await renderProfile(pMe);
        return sock.sendMessage(from, { image: profileBuffer, caption: `👤 *PERFIL DE AVENTURERO: ${pMe.name.toUpperCase()}*` });

      case "bag":
        // Ver mochila visual
        const pBag = await Player.findOne({ userId: sender, groupId: from });
        if (!pBag) return reply(aviso("No tienes un perfil de aventurero. Usa !adventure"));
        const bagBuffer = await renderInventory(pBag);
        return sock.sendMessage(from, { image: bagBuffer, caption: `🎒 *MOCHILA DE ${pBag.name.toUpperCase()}*` });

      case "attack":
        // Atacar enemigo
        const resAttack = await attackTarget(sender, from);
        if (resAttack.error) return reply(aviso(resAttack.error));
        return reply(resAttack.message);

      case "duel":
        // Retar a duelo
        if (!mentionedJids.length) return reply(aviso("Etiqueta a quién deseas retar."));
        const targetDuel = mentionedJids[0];
        const resDuel = await startDuel(sender, targetDuel, from);
        if (resDuel.error) return reply(aviso(resDuel.error));
        return reply(resDuel.message, [targetDuel]);

      case "accept":
        // Aceptar duelo
        const pAccept = await Player.findOne({ userId: sender, groupId: from });
        if (!pAccept?.combatState?.inDuel) return reply(aviso("No tienes retos pendientes."));
        pAccept.combatState.inDuel = false; // Por ahora simplemente reseteamos
        await pAccept.save();
        return reply("⚔️ ¡Duelo aceptado! El combate comienza...");

      case "shop":
        // Tienda visual (pendiente implementar renderShop)
        return reply(aviso("🏪 La tienda está cerrada temporalmente."));

      case "travel":
        // Viajar (cambio de bioma y spawn de enemigos)
        const encounter = await spawnEncounter(from);
        return reply(`🗺️ Has viajado por los senderos de *${from}*.\n       𝄄   💥 ¡Te has topado con un *${encounter.name}*!`);

      default:
        return reply(aviso(`El comando *!${command}* está en fase de desarrollo Alpha.`));
    }
  } catch (err) {
    console.error("❌ Error en RPG Engine:", err);
    const isAdmin = contexto.isOwner || contexto.isMod;
    const msgError = isAdmin 
      ? `💥 *ERROR CRÍTICO RPG:* ${err.message}\n\n_Asegúrate de que la carpeta /assets/ tenga las imágenes y fuentes necesarias._`
      : "💥 Ocurrió un error crítico en el sistema RPG. Notifica a un administrador.";
    return reply(aviso(msgError));
  }
};
