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
import ytdlp from "yt-dlp-exec";
import ytdl from "@distube/ytdl-core";
import fs from "fs";
import { join } from "path";
import { tmpdir } from "os";
import crypto from "crypto";
import sharp from "sharp";
import PQueue from "p-queue";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";

// Configurar ffmpeg
ffmpeg.setFfmpegPath(ffmpegPath);

// ── Cola de Procesamiento IA ──────────────────────────────────────────────────
const iaQueue = new PQueue({ concurrency: 1 }); // Procesar de 1 en 1 para no saturar
const userRequests = new Map(); // Para rastrear envíos masivos por usuario

// ── AntiFlood en RAM ──────────────────────────────────────────────────────────
// groupId:userId → [timestamps]
const floodTracker = new Map();
const FLOOD_LIMIT  = 15;
const FLOOD_WINDOW = 5000; // 5 segundos

// ── Helper: Convertir Cookies JSON a Netscape para yt-dlp ───────────────────────
const jsonToNetscape = (jsonStr) => {
  try {
    const cookies = JSON.parse(jsonStr);
    if (!Array.isArray(cookies)) return jsonStr;
    
    let netscape = "# Netscape HTTP Cookie File\n# http://curl.haxx.se/rfc/cookie_spec.html\n# This is a generated file!  Do not edit.\n\n";
    for (const c of cookies) {
      const domain = c.domain || "";
      const flag = domain.startsWith(".") ? "TRUE" : "FALSE";
      const path = c.path || "/";
      const secure = c.secure ? "TRUE" : "FALSE";
      const expiration = c.expirationDate || Math.floor(Date.now() / 1000) + (3600 * 24 * 365);
      const name = c.name || "";
      const value = c.value || "";
      netscape += `${domain}\t${flag}\t${path}\t${secure}\t${Math.floor(expiration)}\t${name}\t${value}\n`;
    }
    return netscape;
  } catch (e) {
    return jsonStr; // Si no es JSON, devolver tal cual
  }
};

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
    const data = await sock.groupMetadata(groupId);
    metaCache.set(groupId, { data, ts: Date.now() });
    return data;
  } catch (_) { return null; }
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

  // Limpiar búsqueda
  clearTimeout(pending.timer);
  searches.delete(key);

  const { url, title, thumbnail, duration } = result;
  const type = pending.type; // "audio" o "video"

  await sock.sendMessage(from, { react: { text: "⏳", key: msg.key } });

  const tempId = crypto.randomBytes(8).toString("hex");
  const ext = type === "audio" ? "mp3" : "mp4";
  const outputPath = join(tmpdir(), `ytdl_${tempId}.${ext}`);
  const cookiePath = join(tmpdir(), `cookies_${tempId}.txt`);

  try {
    // Preparar opciones de yt-dlp
    const options = {
      output: outputPath,
      format: type === "audio" ? "bestaudio/best" : "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      noCheckCertificates: true,
      noWarnings: true,
    };

    if (type === "audio") {
      options.extractAudio = true;
      options.audioFormat = "mp3";
    }

    // Agregar cookies si están configuradas
    if (config.YOUTUBE_COOKIES) {
      const netscapeCookies = jsonToNetscape(config.YOUTUBE_COOKIES);
      fs.writeFileSync(cookiePath, netscapeCookies);
      options.cookies = cookiePath;
    }

    // Ejecutar descarga
    try {
      if (!config.YOUTUBE_COOKIES) {
        console.warn("⚠️ Advertencia: No se han configurado YOUTUBE_COOKIES. Las descargas pueden fallar con Error 403 o 410.");
      }
      
      await ytdlp(url, options);
    } catch (err) {
      console.warn(`⚠️ yt-dlp falló (${err.message}). Intentando fallback con @distube/ytdl-core...`);
      
      if (type === "audio") {
        try {
          let agent;
          if (config.YOUTUBE_COOKIES) {
            try {
              const cookiesArray = JSON.parse(config.YOUTUBE_COOKIES);
              if (Array.isArray(cookiesArray)) {
                agent = ytdl.createAgent(cookiesArray);
              } else {
                console.warn("⚠️ Las cookies no están en formato de Array JSON.");
              }
            } catch (e) {
              console.warn("⚠️ Las cookies no están en formato JSON. ytdl-core no puede usar createAgent.");
            }
          }

          const stream = ytdl(url, { 
            quality: 'highestaudio',
            filter: 'audioonly',
            agent: agent
          });
          
          const writeStream = fs.createWriteStream(outputPath);
          stream.pipe(writeStream);
          
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error("Timeout en fallback de audio")), 60000);
            writeStream.on('finish', () => { clearTimeout(timeout); resolve(); });
            writeStream.on('error', (e) => { clearTimeout(timeout); reject(e); });
            stream.on('error', (e) => { clearTimeout(timeout); reject(e); });
          });
        } catch (fallbackErr) {
          console.error("❌ Fallback de ytdl-core también falló:", fallbackErr.message);
          throw new Error("YouTube bloqueó todos los intentos de descarga (Error 410/403). Verifica tus YOUTUBE_COOKIES.");
        }
      } else {
        throw err;
      }
    }

    if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
      throw new Error("El archivo descargado está vacío o no existe.");
    }

    const buffer = fs.readFileSync(outputPath);

    if (type === "audio") {
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
      }, { quoted: msg });
    } else {
      await sock.sendMessage(from, {
        video: buffer,
        caption: `🎬 *${title}*\n⏱️ Duración: ${duration.timestamp}`,
        mimetype: "video/mp4"
      }, { quoted: msg });
    }

    await sock.sendMessage(from, { react: { text: "✅", key: msg.key } });
  } catch (error) {
    console.error("Error descargando con yt-dlp:", error.message);
    await sock.sendMessage(from, { text: `❌ Error al descargar el archivo: ${error.message}` });
  } finally {
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    if (fs.existsSync(cookiePath)) fs.unlinkSync(cookiePath);
  }

  return true;
}

// ─────────────────────────────────────────────────────────────────────────────

const handleMessages = async ({ messages, type }, sock, comandos) => {
  if (type !== "notify") return;

  for (const msg of messages) {
    try {
      const mtype = Object.keys(msg.message || {})[0];
      if (mtype === 'viewOnceMessageV2' || mtype === 'viewOnceMessageV3' || mtype === 'viewOnceMessage') {
        msg.message = msg.message[mtype].message;
        msg.type = Object.keys(msg.message)[0];
        console.log(`[ViewOnce] Normalizado de ${mtype} a: ${msg.type}`);
      } else {
        msg.type = mtype;
      }

      if (!msg.message || msg.key.fromMe) continue;
      if (msg.key.remoteJid === "status@broadcast") continue;

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
          const userKey = `${from}:${sender}`;
          const currentCount = (userRequests.get(userKey) || 0) + 1;
          userRequests.set(userKey, currentCount);

          if (currentCount > 3) {
            sock.sendMessage(from, { 
              text: `⚠️ @${sender.split("@")[0]}, no envíes tantas imágenes seguidas, el bot las está analizando todas.`,
              mentions: [sender]
            }).catch(() => {});
          }

          const wasDeleted = await iaQueue.add(async () => {
            try {
              console.log(`[IA] Analizando contenido visual (${msg.type}) de @${sender.split("@")[0]}...`);

              let buffer = await downloadMediaMessage(msg, 'buffer', {}, { re_use: true });
              if (!buffer || buffer.length < 500) {
                await new Promise(resolve => setTimeout(resolve, 1500));
                buffer = await downloadMediaMessage(msg, 'buffer', {}, { re_use: true });
              }

              // ── Check de Seguridad para la IA ──
              if (!buffer || buffer.length === 0) {
                console.error(`❌ [IA] Error: Buffer vacío para @${sender.split("@")[0]}. Cancelando análisis.`);
                return false;
              }

              // EXTRAER FRAME DE VIDEO SI ES NECESARIO
              if (msg.type === 'videoMessage') {
                const videoPath = join(tmpdir(), `temp_ia_${Date.now()}.mp4`);
                const framePath = join(tmpdir(), `temp_ia_frame_${Date.now()}.jpg`);
                fs.writeFileSync(videoPath, buffer);
                
                await new Promise((resolve, reject) => {
                  ffmpeg(videoPath)
                    .screenshot({
                      timestamps: ['00:00:01'],
                      filename: framePath,
                      folder: tmpdir(),
                    })
                    .on('end', resolve)
                    .on('error', reject);
                });
                
                if (fs.existsSync(framePath)) {
                  buffer = fs.readFileSync(framePath);
                  fs.unlinkSync(framePath);
                }
                if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
              }

              // OPTIMIZACIÓN SHARP: Flatten para transparencia
              let imageToAnalyze = await sharp(buffer, { failOnError: false })
                .flatten({ background: { r: 255, g: 255, b: 255 } }) 
                .toFormat('jpeg')
                .toBuffer();

              if (!imageToAnalyze || imageToAnalyze.length === 0) {
                console.error("❌ [IA] Sharp generó un buffer vacío.");
                return false;
              }

              const analysis = await analyzeImage(imageToAnalyze);
              
              // Log de Calibración
              const userInDB = await User.findOne({ jid: sender, groupId: groupJid }).lean();
              const fullIdentity = userInDB?.personaje || userInDB?.nombre || userName;
              console.log('--- CALIBRACIÓN IA --- NSFW:', analysis.nsfwScore, 'GORE:', analysis.goreScore, 'Usuario:', fullIdentity);

              const isSticker = msg.type === 'stickerMessage';
              const nsfwThreshold = isSticker ? 0.80 : 0.70; // Umbral de NudeNet
              const goreThreshold = 0.60; // Umbral de CLIP Gore

              const detectadoNSFW = (analysis.nsfwScore > nsfwThreshold) && cfg.antinsfw;
              const detectadoGORE = (analysis.goreScore > goreThreshold) && cfg.antigore;

              if (detectadoNSFW || detectadoGORE) {
                await sock.sendMessage(from, { react: { text: "💀", key: msg.key } }).catch(() => {});
                await sock.sendMessage(from, { delete: msg.key }).catch(() => {});

                const tipo = detectadoNSFW && detectadoGORE ? "NSFW y GORE" : detectadoNSFW ? "NSFW" : "GORE";
                const estilo = analysis.isAnime ? "Ilustración/Anime" : "Real";
                const motivo = `${msg.type === 'stickerMessage' ? 'Sticker' : 'Contenido'} ${tipo} detectado por IA.`;
                
                const actualizado = await User.findOneAndUpdate(
                  { jid: sender, groupId: groupJid },
                  { $push: { advs: { contenido: motivo, autor: "SISTEMA (IA)", fecha: new Date() } } },
                  { upsert: true, returnDocument: "after" }
                );

                const warns = actualizado?.advs?.length || 1;
                const admins = meta?.participants?.filter(p => p.admin).map(p => p.id) || [];

                await sock.sendMessage(from, { 
                  text: aviso(`🚨 *DETECCIÓN IA: CONTENIDO PROHIBIDO*\n\n` + 
                    `Usuario: *${fullIdentity}*\n` + 
                    `Tipo: *${tipo}*\n` + 
                    `Estilo: *${estilo}*\n` + 
                    `⚠️ Advertencia: *${warns}/3*\n\n` + 
                    `_Detección confirmada. Administradores notificados._`), 
                  mentions: [...admins] 
                });

                if (warns >= 3) {
                  await sock.sendMessage(from, { text: `❌ *${fullIdentity}* expulsado por acumular 3 advertencias.` });
                  await sock.groupParticipantsUpdate(from, [sender], "remove").catch(() => {});
                }
                return true; 
              }
              return false;
            } catch (e) {
              console.error("❌ Error IA:", e.message);
              return false;
            } finally {
              const count = userRequests.get(userKey) || 1;
              if (count <= 1) userRequests.delete(userKey);
              else userRequests.set(userKey, count - 1);
            }
          });

          if (wasDeleted) continue;
        }
      }

      // ── 6. Otros Filtros (AntiPorn Link, AntiNSFW Link, AntiFlood, AntiLink) ──
      
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

      // ── 7. Manejo de Comandos ──────────────────────────────────────────
      if (!isCmd) {
        if (await handleSearchSelection(sock, msg, from, sender, texto)) continue;
        continue;
      }

      const [rawCmd, ...args] = texto.slice(config.PREFIX.length).trim().split(/\s+/);
      const nombreCmd = rawCmd.toLowerCase();

      if (!comandos.has(nombreCmd)) continue;

      const { run, onlyAdmin, onlyMod, onlyOwner } = comandos.get(nombreCmd);
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

      const contexto = {
        msg, sock, sender, from, args, isGroup,
        remoteJid: from,
        isWAAdmin:  isAdmin,
        isMod:      userIsMod,
        isOwner:    isOwner,
        permisos:   isOwner ? 3 : permisos,
        cfg:        cfg || {},
        meta,
        config,
        mentionedJids: msg.message?.extendedTextMessage?.contextInfo?.mentionedJid ?? [],
        reply:  (text, mentions = []) => sock.sendMessage(from, { text, mentions }, { quoted: msg }),
        send:   (text, mentions = []) => sock.sendMessage(from, { text, mentions }),
        react:  (emoji)               => sock.sendMessage(from, { react: { text: emoji, key: msg.key } }),
      };

      await run(contexto);

    } catch (err) {
      console.error("❌ Error crítico en handleMessages:", err);
    }
  }
};

export default handleMessages;
