// src/events/messages.js
import config  from "../config.js";
import User    from "../database/models/User.js";
import Config  from "../database/models/Config.js";
import BanList from "../database/models/BanList.js";
import { solicitudes } from "../store/solicitudes.js";
import { searches } from "../store/searches.js";
import { analyzeImage } from "../utils/detector.js";
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
import { getAiResponse, addFatigue } from "../services/iaService.js";
import play from "play-dl";

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
const FLOOD_LIMIT  = 15;
const FLOOD_WINDOW = 5000; // 5 segundos

setInterval(() => {
  const cutoff = Date.now() - FLOOD_WINDOW;
  for (const [key, times] of floodTracker) {
    const fresh = times.filter(t => t > cutoff);
    if (!fresh.length) floodTracker.delete(key);
    else floodTracker.set(key, fresh);
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
      const videoInfo = await play.video_info(url);
      const stream = await play.stream(url, { quality: 2 }); // Calidad media/alta
      
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
    } else {
      // Para audio optimizado
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

      // ── 1. PRIORIDAD: Contador de Mensajes (Atómico) ──
      User.updateOne(
        { jid: sender, groupId: groupJid },
        { 
          $set: { nombre: userName, lastMessage: new Date() }, 
          $inc: { msgCount: 1 } 
        },
        { upsert: true }
      ).catch(e => console.error("❌ Error DB Contador:", e.message));

      // ── 2. Extraer texto y metadatos básicos ───────────────────────────
      const texto =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        msg.message?.videoMessage?.caption || "";

      const isCmd   = texto.startsWith(config.PREFIX);
      const isOwner = config.OWNERS.includes(sender) || (await User.findOne({ jid: sender, permisos: 3 }).lean());
      const meta    = isGroup ? await getGroupMeta(sock, from) : null;
      const cfg     = isGroup ? await Config.findOne({ groupId: from }).lean() : null;
      const isAdmin = isGroup ? isWAAdmin(meta, sender) : true;

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
            const dbUser  = await User.findOne({ jid: sender, groupId: groupJid }).select("permisos").lean();
            
            if (!adminWA && (dbUser?.permisos ?? 0) < 2) {
              await sock.sendMessage(from, { react: { text: "💀", key: msg.key } }).catch(() => {});
              await sock.sendMessage(from, { delete: msg.key }).catch(() => {});
              
              const tipoStr = detectadoLinkLink ? "Enlace de Grupo" : "Enlace Prohibido/NSFW";
              const actualizado = await User.findOneAndUpdate(
                { jid: sender, groupId: groupJid },
                { $push: { advs: { contenido: `Link prohibido (${tipoStr})`, autor: "SISTEMA", fecha: new Date() } } },
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
      const saysBeyonder = /beyonder|beyond/i.test(texto);

      // Solo disparar si el grupo está marcado como 'Principal'
      const canTriggerIA = cfg?.esPrincipal;

      if (!isCmd && canTriggerIA) {
        let shouldRespond = false;
        let forced = false;

        if (isReplyToBot) {
          shouldRespond = true; // 100% si es respuesta directa al bot
          forced = true;
        } else if (isMentioned || saysBeyonder) {
          // Probabilidad del 25% para menciones o palabras clave
          shouldRespond = Math.random() < 0.25;
        }

        if (shouldRespond) {
          await sock.sendPresenceUpdate('composing', from).catch(() => {});
          
          // Simular delay natural
          const delay = Math.floor(Math.random() * (4000 - 2000 + 1)) + 2000;
          await new Promise(resolve => setTimeout(resolve, delay));

          const history = chatHistories.get(from) || [];
          const { text: aiText, action } = await getAiResponse(sender, from, userName, texto, history, forced);
          
          if (aiText) {
            // Guardar en historial
            history.push({ role: "user", content: texto });
            history.push({ role: "assistant", content: aiText });
            if (history.length > 30) history.splice(0, 2); 
            chatHistories.set(from, history);

            await sock.sendMessage(from, { text: aiText }, { quoted: msg });
            await sock.sendPresenceUpdate('paused', from).catch(() => {});

            // Ejecutar acción detectada (tackled)
            if (action === "tackled") {
              const tackedCmd = comandos.get("tackled");
              if (tackedCmd) {
                const context = {
                  msg, sock, sender, from, args: [], command: "tackled", text: "",
                  isGroup, isWAAdmin: isAdmin, isMod: false, isOwner: false, permisos: 0, cfg: cfg || {}, meta, config,
                  mentionedJids: [],
                  reply: (t) => sock.sendMessage(from, { text: t }, { quoted: msg }),
                  react: (e) => sock.sendMessage(from, { react: { text: e, key: msg.key } })
                };
                await tackedCmd.run(context);
              }
            }
          }
          continue;
        }
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

      const { run, onlyAdmin, onlyMod, onlyOwner } = comandos.get(command);
      const dbUser   = await User.findOne({ jid: sender, groupId: groupJid }).select("permisos").lean();
      const permisos = dbUser?.permisos ?? 0;
      const userIsMod = isAdmin && (permisos >= 2 || isOwner);

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
        isWAAdmin:  isAdmin,
        isMod:      userIsMod,
        isOwner:    isOwner,
        permisos:   isOwner ? 3 : permisos,
        cfg:        cfg || {},
        meta,
        config,
        mentionedJids: msg.message?.extendedTextMessage?.contextInfo?.mentionedJid ?? [],
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
          const userInDB = await User.findOne({ jid: sender, groupId: from }).lean();
          const fullIdentity = userInDB?.personaje || userInDB?.nombre || userName;
          const tipoStr = result.type;

          if (result.status === 'detected') {
            // ── CASO: Seguridad Alta (>85% o >95% Artwork) ──
            if (sock && sock.ev) {
              await sock.sendMessage(from, { react: { text: "🛡️", key: msg.key } }).catch(() => {});
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
            await sock.sendMessage(from, { react: { text: "👁️", key: msg.key } }).catch(() => {});
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
