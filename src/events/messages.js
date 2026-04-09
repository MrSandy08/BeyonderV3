// src/events/messages.js
import config  from "../config.js";
import User    from "../database/models/User.js";
import Config  from "../database/models/Config.js";
import Affinity from "../database/models/Affinity.js";
import CommunityState from "../database/models/CommunityState.js";
import GroupSlang from "../database/models/GroupSlang.js";
import { shouldRespondOrganically } from "../utils/socialFilter.js";
import { getAiResponse, evaluateNickname, detectNicknameIntent, addFatigue } from "../services/iaService.js";
import { enviarReaccionNeko } from "../services/reaccionesService.js";
import BanList from "../database/models/BanList.js";
import BeyonderCore from "../database/models/BeyonderCore.js";
import { solicitudes } from "../store/solicitudes.js";
import { searches } from "../store/searches.js";
import { analyzeImage, analyzeWithClip } from "../utils/detector.js";
import { aviso } from "../utils/format.js";
import { downloadContentFromMessage, downloadMediaMessage } from "@whiskeysockets/baileys";
import fs from "fs";
import { join } from "path";
import { tmpdir } from "os";
import crypto from "crypto";
import sharp from "sharp";
import PQueue from "p-queue";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import { Worker } from "worker_threads";
import { spawnRandomGift } from "../comandos/economia/claim.js";
import play from "play-dl";

// ── Configuración de play-dl con Cookies ─────────────────────────────────────
const COOKIES_PATH = join(process.cwd(), "youtube_cookies.json");
if (fs.existsSync(COOKIES_PATH)) {
  try {
    const cookiesArr = JSON.parse(fs.readFileSync(COOKIES_PATH, "utf-8"));
    const cookieString = cookiesArr.map(c => `${c.name}=${c.value}`).join("; ");
    play.setToken({
      youtube: {
        cookie: cookieString
      }
    });
    console.log("✅ [play-dl] Cookies cargadas correctamente para evitar bloqueo de bot.");
  } catch (e) {
    console.error("❌ [play-dl] Error al cargar cookies de YouTube:", e.message);
  }
}

// Configurar ffmpeg
ffmpeg.setFfmpegPath(ffmpegPath);

// ── 0. GESTIÓN DE MEMORIA IA (Historial por chat) ──────────────────────────
export const chatHistories = new Map();

// ── Cola de Procesamiento IA ──────────────────────────────────────────────────
const iaQueue = new PQueue({ concurrency: 1 }); // Procesar de 1 en 1 para no saturar
const userRequests = new Map(); // Para rastrear envíos masivos por usuario

// ── AntiFlood en RAM ──────────────────────────────────────────────────────────
// groupId:userId → [timestamps]
const floodTracker = new Map();
// from → [timestamps]
const groupMessageTracker = new Map();
const FLOOD_LIMIT  = 15;
const FLOOD_WINDOW = 5000; // 5 segundos

setInterval(() => {
  const cutoff = Date.now() - FLOOD_WINDOW;
  for (const [key, times] of floodTracker) {
    const fresh = times.filter(t => t > cutoff);
    if (!fresh.length) floodTracker.delete(key);
    else floodTracker.set(key, fresh);
  }
  // Limpiar groupMessageTracker también (ventana de 10s)
  const cutoff10 = Date.now() - 10000;
  for (const [key, times] of groupMessageTracker) {
    const fresh = times.filter(t => t > cutoff10);
    if (!fresh.length) groupMessageTracker.delete(key);
    else groupMessageTracker.set(key, fresh);
  }
}, 10_000);

// ── Helper: obtener metadatos del grupo con caché 30s ─────────────────────────
const metaCache = new Map();
async function getGroupMeta(sock, groupId) {
  const cached = metaCache.get(groupId);
  if (cached && Date.now() - cached.ts < 30_000) return cached.data;
  try {
    if (!sock || !sock.ev) return null;
    const data = await sock.groupMetadata(groupId);
    metaCache.set(groupId, { data, ts: Date.now() });
    return data;
  } catch (e) { 
    if (e.message?.includes('Connection Closed')) return null;
    console.error(`❌ Error getGroupMeta (${groupId}):`, e.message);
    return null; 
  }
}

// ── Helper: verificar si el sender es admin WA ────────────────────────────────
function isWAAdmin(meta, jid) {
  const p = meta?.participants?.find(p => p.id === jid);
  return p?.admin === "admin" || p?.admin === "superadmin";
}

// ── Manejador de Selecciones de Búsqueda ────────────────────────────────────
async function handleSearchSelection(sock, msg, from, sender, text) {
  const selection = parseInt(text.trim());
  if (isNaN(selection)) return false;

  const key = `${from}:${sender}`;
  const pending = searches.get(key);
  if (!pending) return false;

  const result = pending.results[selection - 1];
  if (!result) return false;

  // Determinar modo de descarga: si incluye 'mp4' es video, si no es audio
  const isVideo = text.toLowerCase().includes("mp4");
  const mode = isVideo ? "video" : "audio";

  // Limpiar búsqueda
  clearTimeout(pending.timer);
  searches.delete(key);

  const { url, title, thumbnail, duration } = result;

  await sock.sendMessage(from, { react: { text: "⏳", key: msg.key } }).catch(() => {});

  try {
    const isVideo = text.toLowerCase().includes("mp4");
    
    if (isVideo) {
      // Para video usamos play.video_info y stream
      try {
        const videoInfo = await play.video_info(url);
        const stream = await play.stream(url, { quality: 2 });
        
        const chunks = [];
        for await (const chunk of stream.stream) {
          chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);

        await sock.sendMessage(from, {
          video: buffer,
          caption: `🎬 *${title}*\n⏱️ Duración: ${duration.timestamp}`,
          mimetype: "video/mp4"
        }, { quoted: msg }).catch(() => {});
      } catch (e) {
        if (e.message.includes("bot")) {
          return reply("❌ YouTube detectó el bot. Intenta con una URL diferente o contacta al dueño.");
        }
        throw e;
      }
    } else {
      // Para audio optimizado
      try {
        const stream = await play.stream(url, { filter: "audioonly" });
        
        const chunks = [];
        for await (const chunk of stream.stream) {
          chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);

        await sock.sendMessage(from, {
          audio: buffer,
          mimetype: "audio/mpeg",
          fileName: `${title}.mp3`,
          contextInfo: {
            externalAdReply: {
              title,
              body: `Duración: ${duration.timestamp}`,
              thumbnailUrl: thumbnail,
              mediaType: 1,
              renderLargerThumbnail: true
            }
          }
        }, { quoted: msg }).catch(() => {});
      } catch (e) {
        if (e.message.includes("bot")) {
          return reply("❌ YouTube detectó el bot. Intenta con una URL diferente o contacta al dueño.");
        }
        throw e;
      }
    }

    await sock.sendMessage(from, { react: { text: "✅", key: msg.key } }).catch(() => {});
  } catch (error) {
    if (error.message?.includes('Connection Closed')) return true;
    console.error("Error descargando con play-dl:", error.message);
    await sock.sendMessage(from, { text: `❌ Error al descargar: ${error.message}` }).catch(() => {});
  }

  return true;
}

// ─────────────────────────────────────────────────────────────────────────────

const handleMessages = async ({ messages, type }, sock, comandos) => {
  if (type !== "notify") return;

    for (const msg of messages) {
      try {
        if (!msg.message || msg.key.fromMe) continue;
        if (msg.key.remoteJid === "status@broadcast") continue;

        // Guardar estructura original para descarga de media
        const msgOriginal = JSON.parse(JSON.stringify(msg));

        // ── Normalización de Mensaje (viewOnce, ephemeral, etc.) ──
        let mtype = Object.keys(msg.message || {})[0];
        
        // Eliminar wrappers (viewOnce, ephemeral, etc.)
        while (
          mtype === 'viewOnceMessageV2' || 
          mtype === 'viewOnceMessageV3' || 
          mtype === 'viewOnceMessage' || 
          mtype === 'ephemeralMessage' ||
          mtype === 'documentWithCaptionMessage'
        ) {
          msg.message = msg.message[mtype].message || msg.message[mtype];
          mtype = Object.keys(msg.message || {})[0];
        }
        msg.type = mtype;

      // ── Variables Globales del Mensaje ──
      const from      = msg.key.remoteJid;
      const isGroup   = from?.endsWith("@g.us") ?? false;
      const sender    = isGroup ? msg.key.participant : from;
      const groupJid  = isGroup ? from : "private";
      const userName  = msg.pushName || "Usuario";

      if (!sender) continue;

      // ── 2. Extraer texto y metadatos básicos ───────────────────────────
      const texto =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        msg.message?.videoMessage?.caption || "";

      const isCmd   = texto.startsWith(config.PREFIX);
      const meta    = isGroup ? await getGroupMeta(sock, from).catch(() => null) : null;
      const cfg     = isGroup ? await Config.findOne({ groupId: from }).lean().catch(() => null) : null;
      const communityId = meta?.linkedParent || cfg?.communityId || (isGroup ? from : "private");
      const isOwner = config.OWNERS.includes(sender) || (await User.findOne({ jid: sender, communityId, permisos: 3 }).lean().catch(() => null));
      const isAdmin = isGroup ? isWAAdmin(meta, sender) : true;

      // ── 1.2 Procesamiento de Media (Visión Local) ──
      let visualContext = "";
      let isMorboso = false;
      let visualTags = [];
      if (msg.message?.imageMessage || msg.message?.videoMessage || msg.message?.stickerMessage) {
        try {
          const buffer = await downloadMediaMessage(msg, "buffer", {}, { re_use: true });
          
          // 1. Escaneo NSFW/Gore
          const scan = await analyzeImage(buffer);
          if (scan.isNsfw || scan.isGore) {
            const reason = scan.isNsfw ? "contenido obsceno" : "contenido violento";
            // Beyonder se ofende y baja afinidad
            await Affinity.updateOne({ jid: sender, communityId }, { $inc: { points: -5 } });
            await CommunityState.updateOne({ communityId }, { $inc: { tension: 15 } });
            
            const { text: reaction } = await getAiResponse(sender, from, communityId, userName, `El usuario mandó ${reason}. Reacciona con asco o enojo.`, [], true);
            if (reaction) await sock.sendMessage(from, { text: reaction }, { quoted: msg });
            if (scan.immediateDelete) await sock.sendMessage(from, { delete: msg.key });
          } else {
            // 2. Análisis CLIP para contexto y morbo
            const clipResult = await analyzeWithClip(buffer);
            if (clipResult.tags.length > 0) {
              isMorboso = clipResult.isSuggestive;
              visualTags = clipResult.tags;
              visualContext = `[El usuario envió una imagen/sticker que contiene: ${clipResult.tags.join(", ")}${isMorboso ? ". CONTEXTO: Es un contenido sugerente/morboso." : ""}]`;
              console.log(`[VISIÓN] Detectado: ${clipResult.tags.join(", ")} | Morbo: ${isMorboso}`);
            }
          }
        } catch (e) {
          console.error("❌ Error en Procesamiento de Visión:", e.message);
        }
      }

      // Concatenar contexto visual al texto si existe
      const textoFinal = visualContext ? `${visualContext} ${texto}` : texto;

      // ── 1.4 Recolección de Jerga (Mimetismo) ──
      if (isGroup && texto.length > 3 && !isCmd) {
        const words = texto.toLowerCase().split(/\s+/).filter(w => w.length > 4);
        for (const word of words) {
          if (Math.random() > 0.7) { // Muestreo aleatorio para no saturar DB
            await GroupSlang.findOneAndUpdate(
              { communityId, word },
              { $inc: { count: 1 }, $set: { lastUsed: new Date() } },
              { upsert: true }
            ).catch(() => {});
          }
        }
      }

        // ── 1. PRIORIDAD: Contador de Mensajes, Afinidad y Autoreparación ──
        const dbUser = await User.findOneAndUpdate(
          { jid: sender, communityId: communityId },
          { 
            $setOnInsert: { 
              personaje: null,
              money: 0,
              bank: 0,
              permisos: 0,
              lastDaily: new Date(0)
            },
            $set: { 
              lastMessage: new Date(), 
              groupId: groupJid,
              nombre: userName 
            }, 
            $inc: { msgCount: 1 } 
          },
          { upsert: true, new: true, lean: true }
        ).catch(e => {
          if (e.code !== 11000) { // Ignorar error de duplicado por concurrencia
            console.error("❌ Error DB Contador:", e.message);
          }
          return null;
        });

        // Actualizar Afinidad e Interacciones
        await Affinity.findOneAndUpdate(
          { jid: sender, communityId: communityId },
          { 
            $inc: { points: 0.1, interactions: 1 }, 
            $set: { lastInteraction: new Date() } 
          },
          { upsert: true }
        ).catch(e => {
          if (e.code !== 11000) {
            console.error("❌ Error DB Afinidad:", e.message);
          }
        });

        // ── 1.1. Monitoreo de Tensión y "Peleas" ──
        if (isGroup) {
          let state = await CommunityState.findOne({ communityId });
          if (!state) state = await CommunityState.create({ communityId });

          // Detección de gritos (Mayúsculas)
          const isShouting = textoFinal.length > 5 && textoFinal === textoFinal.toUpperCase() && /[A-Z]/.test(textoFinal);
          if (isShouting) {
            await CommunityState.updateOne({ communityId }, { $inc: { tension: 2 } });
          }
          
          // Actualizar última actividad
          await CommunityState.updateOne({ communityId }, { $set: { lastActivity: new Date() } });
        }

        // ── 1.3 Gestión de Promesas (Recordatorios) ──
        if (isCmd) {
          // Si el bot detecta que hizo una promesa en su respuesta (esto se procesará después)
          // Pero aquí podemos revisar si hay promesas pendientes para este usuario
          const core = await BeyonderCore.findOne();
          if (core?.promises?.length > 0) {
            const miPromesa = core.promises.find(p => p.jid === sender && p.communityId === communityId && !p.completed);
            if (miPromesa) {
              visualContext += ` [RECORDATORIO: Tienes una promesa pendiente con este usuario: "${miPromesa.content}"]`;
            }
          }
        }

      // ── 2.5 Spawn de Regalo Aleatorio (!claim) ──
      const economyOn = isGroup && cfg && cfg.economyActive !== false;
      if (economyOn && !isCmd && Math.random() < 0.005) {
        spawnRandomGift(sock, from);
      }

      // ── 3. Prioridad del Interruptor (!beyonder on) ───────────────────────
      if (isCmd && (texto.toLowerCase() === `${config.PREFIX}beyonder on` || texto.toLowerCase() === `${config.PREFIX}beyonder off`)) {
        if (!isOwner) {
          await sock.sendMessage(from, { text: "⛔ Solo *Owners* pueden usar este comando." }, { quoted: msg });
          continue;
        }
        const activo = texto.toLowerCase().includes(" on");
        await Config.findOneAndUpdate({ groupId: from }, { $set: { botActivo: activo } }, { upsert: true });
        await sock.sendMessage(from, { react: { text: activo ? "⚡" : "💤", key: msg.key } });
        
        if (activo) {
          await sock.sendMessage(from, { 
            text: `𝄄➥ Los sistemas de IA y moderación están en línea.\n` +
                  `       @𝐀𝗍𝗍𝖾 : ℬeyonder`
          }, { quoted: msg });
        } else {
          await sock.sendMessage(from, { text: aviso("*Beyonder en silencio.* 💤\n       𝄄   _Solo los Owners pueden activarme._") }, { quoted: msg });
        }
        continue;
      }

      // ── 4. Verificar si el bot está activo (Bypass para Staff) ───────────
      if (cfg && cfg.botActivo === false && !isOwner && !isAdmin) continue;

      // ── 5. Filtrado de Media (IA) ─────────────────────────────────────────
      const visualMessage = msg.message?.imageMessage || msg.message?.videoMessage || msg.message?.stickerMessage;

      if (isGroup && visualMessage) {
        if (cfg?.antinsfw || cfg?.antigore) {
          // LANZAR EL ANÁLISIS SIN "AWAIT" PARA NO BLOQUEAR EL BOT (UX Optimización)
          procesarMediaBackground(sock, msgOriginal, from, sender, cfg, meta, userName);
          // console.log(`[IA] Análisis de ${msg.type} iniciado en segundo plano para @${sender.split("@")[0]}`);
        }
      }

      // ── 6. Otros Filtros (AntiPorn Link, AntiNSFW Link, AntiFlood, AntiLink) ──
      
      // Auto-Descarga de Links (Cobalt)
      const cobaltRegex = /(https?:\/\/[^\s]+)/gi;
      const cobaltMatch = texto.match(cobaltRegex);
      if (cobaltMatch && !isCmd) {
        for (const link of cobaltMatch) {
          if (isCobaltUrl(link)) {
            console.log(`[Cobalt] Detectado link auto-descargable: ${link}`);
            const res = await downloadCobalt(link, "video");
            if (res.success) {
              await sock.sendMessage(from, { react: { text: "📥", key: msg.key } }).catch(() => {});
              await sock.sendMessage(from, {
                video: res.buffer,
                mimetype: "video/mp4",
                caption: `✅ *Contenido descargado con Cobalt*`
              }, { quoted: msg }).catch(() => {});
            }
          }
        }
      }

      // A. Verificar Baneado
      const baneado = await BanList.findOne({ jid: sender }).lean();
      if (baneado) {
        if (isGroup) await sock.groupParticipantsUpdate(from, [sender], "remove").catch(() => {});
        continue;
      }

      // B. AntiFlood
      if (isGroup && cfg?.antiflood && !isCmd) {
        const key  = `${from}:${sender}`;
        const now  = Date.now();
        const times = (floodTracker.get(key) || []).filter(t => now - t < FLOOD_WINDOW);
        times.push(now);
        floodTracker.set(key, times);

        if (times.length >= FLOOD_LIMIT) {
          floodTracker.delete(key);
          await sock.sendMessage(from, {
            text: `  ⤷ ゛🌊  ˎˊ˗\n  ♯ ·  · *AntiFlood activado.*\n  @${sender.split("@")[0]} generó demasiados mensajes. Grupo cerrado 30s.`,
            mentions: [sender],
          }).catch(() => {});
          await sock.groupSettingUpdate(from, "announcement").catch(() => {});
          setTimeout(() => sock.groupSettingUpdate(from, "not_announcement").catch(() => {}), 30_000);
          continue;
        }
      }

      // ── SISTEMA DE APELACIÓN (CUARENTENA) ──
      const bodyTmp = texto.trim();
      const cmdTmp  = isCmd ? bodyTmp.split(/\s+/)[0].toLowerCase().slice(config.PREFIX.length) : "";
      
      if (isCmd && (cmdTmp === "error" || cmdTmp === "check")) {
        if (!msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
          await sock.sendMessage(from, { text: aviso("⚠️ Responde al mensaje del bot que notificó el borrado.") }, { quoted: msg });
          continue;
        }
        await sock.sendMessage(from, { text: aviso("🛡️ *REVISIÓN SOLICITADA*\n\nHe registrado este posible error de mis sensores. Un administrador revisará el log para verificar si fue un falso positivo. ¡Gracias por avisar! 👁️") }, { quoted: msg });
        continue;
      }

      // C. Filtros de Texto (Enlaces)
      if (isGroup && (cfg?.antilink || cfg?.antiporn || cfg?.antinsfw)) {
        const urlRegex = /(https?:\/\/[^\s]+|chat\.whatsapp\.com\/[^\s]+)/gi;
        const links    = texto.match(urlRegex) || [];

        if (links.length) {
          const { NSFW_DOMAINS } = await import("../comandos/mod/antiporn.js").catch(() => ({ NSFW_DOMAINS: [] }));
          const detectadoLinkLink = cfg?.antilink && links.some(l => l.includes("chat.whatsapp.com/"));
          const detectadoLinkPorn = (cfg?.antiporn || cfg?.antinsfw) && links.some(l => NSFW_DOMAINS.some(d => l.toLowerCase().includes(d)));

          if (detectadoLinkLink || detectadoLinkPorn) {
            const adminWA = isWAAdmin(meta, sender);
            const dbUser  = await User.findOne({ jid: sender, communityId }).select("permisos").lean();
            
            if (!adminWA && (dbUser?.permisos ?? 0) < 2) {
              await sock.sendMessage(from, { react: { text: "💀", key: msg.key } }).catch(() => {});
              await sock.sendMessage(from, { delete: msg.key }).catch(() => {});
              
              const tipoStr = detectadoLinkLink ? "Enlace de Grupo" : "Enlace Prohibido/NSFW";
              const actualizado = await User.findOneAndUpdate(
                { jid: sender, communityId },
                { 
                  $push: { advs: { contenido: `Link prohibido (${tipoStr})`, autor: "SISTEMA", fecha: new Date() } },
                  $set: { groupId: groupJid }
                },
                { upsert: true, returnDocument: "after" }
              );

              const total = actualizado?.advs?.length || 1;
              const fullIdentity = actualizado?.personaje || actualizado?.nombre || userName;

              await sock.sendMessage(from, {
                text: aviso(`🚨 *FILTRO DE ENLACES*\n\nUsuario: *${fullIdentity}*\nTipo: *${tipoStr}*\nAcción: Eliminado + Advertencia (#${total}/3).`)
              });

              if (total >= 3) {
                await sock.sendMessage(from, { text: `❌ *${fullIdentity}* expulsado por exceso de advertencias.` });
                await sock.groupParticipantsUpdate(from, [sender], "remove").catch(() => {});
              }
              continue;
            }
          }
        }
      }

      // ── 7. Disparador de IA (Si no es comando) ─────────────────────────
      const botId = sock.user.id.split(":")[0] + "@s.whatsapp.net";
      const isMentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.includes(botId);
      const isReplyToBot = msg.message?.extendedTextMessage?.contextInfo?.participant === botId;

      // ── 1.5 Filtro de Relevancia Social (¿Debería hablar?) ──
      const isMencionDirecta = isMentioned || isReplyToBot;

      // Track group speed
      const groupTimes = (groupMessageTracker.get(from) || []).filter(t => Date.now() - t < 10000);
      groupTimes.push(Date.now());
      groupMessageTracker.set(from, groupTimes);
      const isConversationFast = groupTimes.length > 5;

      // ── 1.6 Módulo de Escucha Pasiva de Identidad ──
      const nicknameKeywords = ["dime", "llámame", "apodo", "soy", "llámame", "decir"];
      if (!isCmd && (isMencionDirecta || nicknameKeywords.some(k => texto.toLowerCase().includes(k)))) {
        const proposedNick = await detectNicknameIntent(texto);
        
        if (proposedNick) {
          const aff = await Affinity.findOne({ jid: sender, communityId }).lean();
          const { accepted, reason } = await evaluateNickname(sender, communityId, userName, proposedNick, aff?.points || 0, visualTags, isMorboso);
          
          // Actualizar Affinity
          await Affinity.updateOne(
            { jid: sender, communityId },
            { 
              $set: { 
                "nickname.proposed": proposedNick,
                "nickname.accepted": accepted,
                "nickname.final": accepted ? proposedNick : null,
                "nickname.rejectionReason": accepted ? null : reason
              } 
            }
          );

          // Actualizar User (Identidad Dinámica)
          if (accepted) {
            await User.updateOne(
              { jid: sender, communityId },
              { 
                $set: { "identidad.apodo_actual": proposedNick },
                $addToSet: { "identidad.historial_apodos": proposedNick }
              }
            );
          } else {
            await User.updateOne(
              { jid: sender, communityId },
              { $addToSet: { "identidad.apodos_rechazados": proposedNick } }
            );
          }
          
          // Regla de Saliencia: Si la charla está rápida, guarda en silencio.
          // Si está tranquila o es mención directa, responde.
          if (!isConversationFast || isMencionDirecta) {
            await sock.sendMessage(from, { text: reason }, { quoted: msg });
            continue; // No procesar más este mensaje si ya respondimos sobre el apodo
          }
        }
      }

      const debeHablar = !isCmd && cfg?.esPrincipal && await shouldRespondOrganically({
        sender, communityId, isGroup, isMencionDirecta, isMorboso, texto, visualTags
      });

      if (debeHablar) {
          let forced = isReplyToBot;
          await sock.sendPresenceUpdate('composing', from).catch(() => {});
          
          // Simular delay natural
          const delay = Math.floor(Math.random() * (4000 - 2000 + 1)) + 2000;
          await new Promise(resolve => setTimeout(resolve, delay));

          const history = chatHistories.get(from) || [];
          const mentionedJids = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
          const { text: aiText, action } = await getAiResponse(sender, from, communityId, userName, textoFinal, history, forced, mentionedJids);
          
          if (aiText) {
              // Extraer menciones de la respuesta de la IA (JIDs que empiecen con @)
              const extraMentions = aiText.match(/@\d+(@s\.whatsapp\.net)?/g) || [];
              const finalMentions = [...new Set([...mentionedJids, ...extraMentions.map(m => m.replace("@", "") + (m.includes("@") ? "" : "@s.whatsapp.net"))])];

              // ── Procesar Acciones (Bautizo) ──
              if (action?.type === "BAUTIZO") {
                await Affinity.updateOne({ jid: sender, communityId }, { $set: { "nickname.accepted": true, "nickname.final": action.nickname } });
                await User.updateOne({ jid: sender, communityId }, { $set: { "identidad.apodo_actual": action.nickname }, $addToSet: { "identidad.historial_apodos": action.nickname } });
              }

              // ── Procesar Reacciones (Neko.best) ──
              if (action?.reaction) {
                await enviarReaccionNeko(sock, from, action.reaction, msg, finalMentions);
              }

              // ── Gestión de Promesas (Detectar intenciones) ──
              if (aiText.toLowerCase().includes("prometo") || aiText.toLowerCase().includes("mañana te") || aiText.toLowerCase().includes("luego te")) {
                await BeyonderCore.updateOne({}, {
                  $push: {
                    promises: {
                      jid: sender,
                      communityId,
                      content: aiText.substring(0, 100),
                      dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
                    }
                  }
                });
              }

              // ── Simulación de Escritura Humana y Fragmentación ──
            const fragments = aiText.split("\n\n").filter(f => f.trim().length > 0);
            
            for (const part of fragments) {
              // Calcular delay basado en longitud (promedio 10 chars/seg)
              const typingTime = Math.min(Math.max(part.length * 50, 1500), 5000);
              
              await sock.sendPresenceUpdate("composing", from).catch(() => {});
              await new Promise(res => setTimeout(res, typingTime));
              
              await sock.sendMessage(from, { text: part.trim(), mentions: finalMentions }, { quoted: msg }).catch(() => {});
              
              // Pequeña pausa entre fragmentos
              if (fragments.length > 1) await new Promise(res => setTimeout(res, 1000));
            }

            // Guardar en historial
            history.push({ role: "user", content: texto });
            history.push({ role: "assistant", content: aiText });
            if (history.length > 30) history.splice(0, 2); 
            chatHistories.set(from, history);

            await sock.sendPresenceUpdate('paused', from).catch(() => {});
          }
          continue;
        }

      // ── 8. Manejo de Comandos ──────────────────────────────────────────
      if (!isCmd) {
        if (await handleSearchSelection(sock, msg, from, sender, texto)) continue;
        continue;
      }

      const body = texto.trim();
      const command = body.split(/\s+/)[0].toLowerCase().slice(config.PREFIX.length);
      const args = body.split(/\s+/).slice(1);
      const text = args.join(" ");

      if (!comandos.has(command)) continue;

      // ── 8.5 Verificación de Economía Activa ───────────────────────────
      const ECO_CMDS = [
        "work", "trabajar", "slut", "puta", "minar", "mine", "pescar", "fish", 
        "cazar", "hunt", "atracar", "rob", "robar", "asalto", "extorsionar", 
        "extort", "cultivar", "cosechar", "plantar",
        "crimen", "suerte", "ricos", "topricos", "millonarios", "topmoney",
        "depositar", "retirar", "fianza", "claim", "reclamar", "regalo", "impuesto"
      ];

      if (ECO_CMDS.includes(command) && isGroup && cfg && cfg.economyActive === false) {
        return; // No responder nada si la economía está en OFF
      }

      const { run, onlyAdmin, onlyMod, onlyOwner } = comandos.get(command);
      
      const permisos = dbUser?.permisos ?? 0;
      const userIsMod = isAdmin && (permisos >= 2 || isOwner);

      // ── 9. Verificación de Cárcel (Solo bloquea economía) ───────────────
      if (dbUser?.isJailed) {
        const ahora = new Date();
        if (dbUser.jailUntil && dbUser.jailUntil > ahora) {
          const ECO_CMDS = [
            "work", "trabajar", "slut", "puta", "minar", "mine", "pescar", "fish", 
            "cazar", "hunt", "atracar", "rob", "robar", "asalto", "extorsionar", 
            "extort", "cultivar", "cosechar", "plantar",
            "crimen", "suerte"
          ];

          if (ECO_CMDS.includes(command)) {
            const restante = Math.ceil((dbUser.jailUntil - ahora) / 60000);
            return await sock.sendMessage(from, { 
              text: `⛓️ *ESTÁS EN LA CÁRCEL*\n\nNo puedes realizar actividades económicas mientras cumples tu condena.\n       𝄄   _Tiempo restante: ${restante} minutos_\n       𝄄   _Usa *!fianza* para salir inmediatamente._` 
            }, { quoted: msg });
          }
        } else {
          // Si el tiempo expiró, liberar automáticamente
          await User.updateOne({ jid: sender, communityId }, { $set: { isJailed: false, jailUntil: null } });
        }
      }

      let tienePermiso = true;
      let motivo       = "";

      if      (onlyOwner && !isOwner)              { tienePermiso = false; motivo = "⛔ Solo *Owners* pueden usar este comando."; }
      else if (onlyMod   && !userIsMod && !isOwner) { tienePermiso = false; motivo = "⛔ Solo *Moderadores* u Owners pueden usar este comando."; }
      else if (onlyAdmin && !isAdmin && !isOwner)   { tienePermiso = false; motivo = "⛔ Solo *Admins* del grupo pueden usar este comando."; }

      if (!tienePermiso) {
        await sock.sendMessage(from, { text: motivo }, { quoted: msg });
        continue;
      }

      // Sumar fatiga por comando
      if (["mine", "fish", "reporte"].includes(command)) {
        addFatigue(10);
      }

      const contexto = {
        msg, sock, sender, from, args, isGroup, command, text,
        remoteJid: from,
        communityId,
        isWAAdmin:  isAdmin,
        isMod:      userIsMod,
        isOwner:    isOwner,
        permisos:   isOwner ? 3 : permisos,
        cfg:        cfg || {},
        meta,
        config,
        mentionedJids: msg.message?.[mtype]?.contextInfo?.mentionedJid ?? [],
        reply:  async (text, mentions = []) => {
          for (let i = 0; i < 3; i++) {
            try {
              if (!sock || !sock.ev) return;
              return await sock.sendMessage(from, { text, mentions }, { quoted: msg });
            } catch (e) {
              if (e.message?.includes('Connection Closed')) {
                console.warn(`⚠️ Intento de envío fallido: Conexión cerrada. Deteniendo reintentos.`);
                return;
              }
              if (i === 2) throw e;
              await new Promise(r => setTimeout(r, 1000));
            }
          }
        },
        send:   async (text, mentions = []) => {
          for (let i = 0; i < 3; i++) {
            try {
              if (!sock || !sock.ev) return;
              return await sock.sendMessage(from, { text, mentions });
            } catch (e) {
              if (e.message?.includes('Connection Closed')) return;
              if (i === 2) throw e;
              await new Promise(r => setTimeout(r, 1000));
            }
          }
        },
        react:  async (emoji) => {
          for (let i = 0; i < 3; i++) {
            try {
              if (!sock || !sock.ev) return;
              return await sock.sendMessage(from, { react: { text: emoji, key: msg.key } });
            } catch (e) {
              if (e.message?.includes('Connection Closed')) return;
              if (i === 2) throw e;
              await new Promise(r => setTimeout(r, 1000));
            }
          }
        },
      };

      await run(contexto);

    } catch (err) {
      console.error("❌ Error crítico en handleMessages:", err);
    }
  }
};

export default handleMessages;

/**
 * Procesa imágenes, stickers y videos en segundo plano usando Worker Threads.
 * No bloquea el hilo principal de WhatsApp.
 */
async function procesarMediaBackground(sock, msg, from, sender, cfg, meta, userName) {
  iaQueue.add(async () => {
    let tempVideoPath = null;
    try {
      // 1. Descargar el medio
      let buffer = await downloadMediaMessage(msg, 'buffer', {}, { re_use: true });
      if (!buffer || buffer.length < 500) {
        await new Promise(r => setTimeout(r, 1000));
        buffer = await downloadMediaMessage(msg, 'buffer', {}, { re_use: true });
      }
      if (!buffer) return;

      const mtype = Object.keys(msg.message || {})[0];

      // 2. Extraer frame si es video
      if (mtype === 'videoMessage') {
        tempVideoPath = join(tmpdir(), `worker_temp_${Date.now()}.mp4`);
        const framePath = join(tmpdir(), `worker_frame_${Date.now()}.jpg`);
        fs.writeFileSync(tempVideoPath, buffer);
        
        await new Promise((resolve, reject) => {
          ffmpeg(tempVideoPath)
            .screenshot({ timestamps: ['00:00:00', '00:00:01'], filename: framePath, folder: tmpdir() })
            .on('end', resolve)
            .on('error', reject);
        });

        if (fs.existsSync(framePath)) {
          buffer = fs.readFileSync(framePath);
          fs.unlinkSync(framePath);
        }
      }

      // 3. Lanzar Worker Thread para el análisis (Sharp + IA)
      // Pasamos el path absoluto del worker
      const workerPath = join(process.cwd(), 'src', 'utils', 'mediaWorker.js');
      
      const result = await new Promise((resolve) => {
        const worker = new Worker(workerPath, {
          workerData: { buffer, type: mtype },
          env: process.env // Pasar variables de entorno al worker
        });
        worker.on('message', resolve);
        worker.on('error', (err) => resolve({ status: 'error', error: err.message }));
        worker.on('exit', (code) => {
          if (code !== 0) resolve({ status: 'error', error: `Worker exit code ${code}` });
        });
      });

      // 4. Actuar según el resultado
      if (result.status === 'detected' || result.status === 'doubt') {
        const isNSFW = result.type === 'NSFW' && cfg.antinsfw;
        const isGore = result.type === 'GORE' && cfg.antigore;

        if (isNSFW || isGore) {
          const prob = result.score ? (result.score * 100).toFixed(1) : "??";
          const userInDB = await User.findOne({ jid: sender, communityId: cfg.communityId || from }).lean();
          const fullIdentity = userInDB?.personaje || userInDB?.nombre || userName;
          const tipoStr = result.type;

          if (result.status === 'detected') {
            // ── CASO: Seguridad Alta (>85% o >95% Artwork) ──
            if (sock && sock.ev) {
              await sock.sendMessage(from, { delete: msg.key }).catch(() => {});
            }

            const logMsg = `🛡️ *SISTEMA DE CUARENTENA IA (ALTA CONFIANZA)*\n\n` +
              `• Usuario: *${fullIdentity}* (@${sender.split("@")[0]})\n` +
              `• Detección: *${tipoStr}* (${result.detectedClass || 'Gore'})\n` +
              `• Confianza: *${prob}%* ${result.isArtwork ? "🎨 (Artwork)" : ""}\n\n` +
              `_Mensaje eliminado automáticamente. Si crees que es un error, usa *!error* respondiendo a este mensaje._`;

            await sock.sendMessage(from, { text: aviso(logMsg), mentions: [sender] }).catch(() => {});
          } else if (result.status === 'doubt') {
            // ── CASO: Duda (65% - 85%) ──
            console.log(`[IA DUDA] ${tipoStr} sospechoso (${prob}%) de @${sender.split("@")[0]}. No se borra.`);
          }
        }
      }
    } catch (error) {
      console.error("❌ [Worker Manager Error]:", error.message);
    } finally {
      // 5. Limpieza de seguridad (Garantizar que no quedan temporales)
      if (tempVideoPath && fs.existsSync(tempVideoPath)) {
        try { fs.unlinkSync(tempVideoPath); } catch (e) {}
      }
    }
  });
}
