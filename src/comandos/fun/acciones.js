// src/comandos/general/acciones.js
// Cubre: !hug !kiss !pat !bite !slap !punch
// Usa nekos.best (gratuito, sin API key, GIFs anime)
import User from "../../database/models/User.js";
import { aviso } from "../../utils/format.js";
import userTarget from "../../utils/userTarget.js";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "ffmpeg-static";
import { promises as fs } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import crypto from "crypto";
import axios from "axios";

// Configurar ffmpeg
ffmpeg.setFfmpegPath(ffmpegInstaller);

async function gifToMp4(buffer) {
  const tempId = crypto.randomBytes(8).toString("hex");
  const inputPath = join(tmpdir(), `input_${tempId}.gif`);
  const outputPath = join(tmpdir(), `output_${tempId}.mp4`);

  try {
    await fs.writeFile(inputPath, buffer);

    return new Promise((resolve, reject) => {
      const command = ffmpeg(inputPath)
        .outputOptions([
          "-c:v libx264",
          "-pix_fmt yuv420p",
          "-crf 23",
          "-preset ultrafast",
          "-movflags faststart",
          "-an",
          "-vf scale=trunc(iw/2)*2:trunc(ih/2)*2"
        ])
        .toFormat("mp4")
        .on("end", async () => {
          try {
            const mp4Buffer = await fs.readFile(outputPath);
            await fs.unlink(inputPath).catch(() => {});
            await fs.unlink(outputPath).catch(() => {});
            resolve(mp4Buffer);
          } catch (e) {
            reject(e);
          }
        })
        .on("error", async (err) => {
          await fs.unlink(inputPath).catch(() => {});
          await fs.unlink(outputPath).catch(() => {});
          reject(err);
        });

      command.save(outputPath);

      // Timeout de 10 segundos para la conversión
      setTimeout(() => {
        command.kill();
        reject(new Error("FFmpeg conversion timeout"));
      }, 10000);
    });
  } catch (error) {
    await fs.unlink(inputPath).catch(() => {});
    await fs.unlink(outputPath).catch(() => {});
    throw error;
  }
}

export const name      = "hug";
export const aliases   = ["kiss", "pat", "bite", "slap", "punch", "tackled", "kabedon", "carry", "pback"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

// ─── Config por acción ────────────────────────────────────────────────────────
const ACCIONES = {
  hug:   { emoji: "🤗", endpoint: "hug",   textos: [
    "*{yo}* le da un abrazo enorme a *{target}*. 🤗",
    "*{yo}* envuelve a *{target}* en sus brazos. 💞",
    "*{yo}* abraza fuerte a *{target}* y no lo suelta. 🫂",
  ]},
  kiss:  { emoji: "💋", endpoint: "kiss",  textos: [
    "*{yo}* le da un beso a *{target}*. 💋",
    "*{yo}* se acerca y besa a *{target}* suavemente. 🌸",
    "*{yo}* le roba un beso a *{target}*. 😘",
  ]},
  pat:   { emoji: "🥰", endpoint: "pat",   textos: [
    "*{yo}* le da palmaditas en la cabeza a *{target}*. 🥰",
    "*{yo}* acaricia la cabeza de *{target}* con ternura. ✨",
    "*{yo}* le da pat pat a *{target}*. 💆",
  ]},
  bite:  { emoji: "😈", endpoint: "bite",  textos: [
    "*{yo}* muerde a *{target}*. 😈",
    "*{yo}* clava los dientes en *{target}*. 🦷",
    "*{yo}* no pudo resistirse y mordió a *{target}*. 😏",
  ]},
  slap:  { emoji: "👋", endpoint: "slap",  textos: [
    "*{yo}* le da una bofetada a *{target}*. 👋",
    "*{yo}* abofetea a *{target}* sin contemplaciones. 😤",
    "*{yo}* le dejó la mano marcada a *{target}*. 💢",
  ]},
  punch: { emoji: "👊", endpoint: "punch", textos: [
    "*{yo}* le da un puñetazo a *{target}*. 👊",
    "*{yo}* golpea a *{target}* con toda su fuerza. 💥",
    "*{yo}* no aguantó más y le pegó a *{target}*. 😠",
  ]},
  tackled: { emoji: "🦶", endpoint: "kick", textos: [
    "*{yo}* le da una patada a *{target}*. 🦶",
    "*{yo}* patea a *{target}* con fuerza. 💥",
    "*{yo}* mandó a volar a *{target}* de una patada. 💨",
  ]},
  kabedon: { emoji: "🫦", endpoint: "kabedon", textos: [
    "*{yo}* acorrala a *{target}* contra la pared con intensidad. 🫦",
    "*{yo}* deja a *{target}* sin aliento tras un kabedon. 🔥",
    "*{yo}* domina a *{target}* con un movimiento rápido. ⛓️",
  ]},
  carry: { emoji: "🏋️", endpoint: "hug", textos: [ // Usamos 'hug' como fallback visual de nekos.best
    "¡*{yo}* ha tomado a *{target}* en sus brazos! 🏋️",
    "*{yo}* carga a *{target}* con facilidad. 💪",
    "*{yo}* alza a *{target}* y lo lleva consigo. ✨",
  ]},
  pback: { emoji: "🐎", endpoint: "pat", textos: [ // Usamos 'pat' o 'hug' como fallback visual
    "¡*{yo}* se ha subido a la espalda de *{target}*! ¡Arre! 🐎",
    "*{yo}* cabalga sobre la espalda de *{target}*. 🐎✨",
    "*{yo}* salta sobre *{target}* para que lo carguen. 🧸",
  ]},
};

// ─── Obtener GIF desde nekos.best ─────────────────────────────────────────────
async function fetchGif(endpoint) {
  try {
    const res  = await axios.get(`https://nekos.best/api/v2/${endpoint}?amount=1`, {
      headers: { "User-Agent": "BeyonderBot/3.0" },
      timeout: 8000
    });
    return res.data?.results?.[0]?.url || null;
  } catch (_) {
    return null;
  }
}

// ─── Descargar buffer del GIF ──────────────────────────────────────────────────
async function downloadBuffer(url) {
  try {
    const res = await axios.get(url, {
      responseType: "arraybuffer",
      headers: { "User-Agent": "BeyonderBot/3.0" },
      timeout: 15000
    });
    return Buffer.from(res.data);
  } catch (_) {
    return null;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const numFromJid   = (jid) => jid?.split("@")[0] || jid;
const primerNombre = (n)   => n?.split(" ")[0] || n || "???";
const pick         = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ─────────────────────────────────────────────────────────────────────────────

export const run = async (contexto) => {
  const { reply, react, sender, mentionedJids, from, sock, msg, args } = contexto;

  // Detectar cuál acción se ejecutó
  const rawBody = (
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text || ""
  ).trim().toLowerCase().split(/\s+/)[0].replace("!", "");

  const accion = ACCIONES[rawBody];
  if (!accion) return; // no debería pasar, pero por seguridad

  // Target — usa userTarget para detectar mención, citado o nombre
  const targetJid = await userTarget(contexto, User);

  // Determinar si es una auto-acción (cuando no se especificó un target diferente)
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.participant || 
                 msg.message?.imageMessage?.contextInfo?.participant ||
                 msg.message?.videoMessage?.contextInfo?.participant;
  const hasMention = mentionedJids && mentionedJids.length > 0;
  const hasArgs    = args && args.length > 0;
  const targetEspecificado = quoted || hasMention || hasArgs;

  let nombreYo     = `@${numFromJid(sender)}`;
  let nombreTarget = (targetJid === sender && !targetEspecificado) ? "sí mismo" : `@${numFromJid(targetJid)}`;

  // Obtener nombres desde DB o fallback a número
  const dbYo     = await User.findOne({ jid: sender, groupId: from }).select("personaje").lean();
  const dbTarget = (targetJid === sender && !targetEspecificado) ? null : await User.findOne({ jid: targetJid, groupId: from }).select("personaje").lean();

  if (dbYo?.personaje)     nombreYo     = primerNombre(dbYo.personaje);
  if (dbTarget?.personaje) nombreTarget = primerNombre(dbTarget.personaje);

  // Construir texto de la acción
  const textoAccion = pick(accion.textos)
    .replace("{yo}",     nombreYo)
    .replace("{target}", nombreTarget);

  // Reaccionar mientras carga el GIF
  await react(accion.emoji);

  // Obtener URL del GIF
  const gifUrl = await fetchGif(accion.endpoint);

  if (!gifUrl) {
    // Fallback: solo texto si no hay GIF
    return reply(aviso(textoAccion));
  }

  // Descargar buffer
  let buffer = await downloadBuffer(gifUrl);
  if (!buffer || buffer.length === 0) {
    return reply(aviso(textoAccion));
  }

  // Intentar convertir GIF a MP4 real para mejor compatibilidad
  let finalBuffer = buffer;
  let converted = false;
  try {
    finalBuffer = await gifToMp4(buffer);
    converted = true;
  } catch (err) {
    console.error("⚠️ No se pudo convertir GIF a MP4, enviando original:", err.message);
  }

  // Enviar video/GIF con caption decorado
  const caption =
    `                 𑂯 ( ${accion.emoji} ) ⁺ 𓈒  ׁ     \n` +
    ` 𝄄➥ _${textoAccion}_\n` +
    `       𝄄   @𝐀𝗍𝗍𝖾 : ℬeyonder`;

  try {
    await sock.sendMessage(
      from,
      {
        video:    finalBuffer,
        mimetype: "video/mp4",
        caption,
        gifPlayback: true,  // hace que se reproduzca como GIF en WhatsApp
        mentions: [sender, ...(targetJid !== sender ? [targetJid] : [])],
      },
      { quoted: msg }
    );
  } catch (err) {
    console.error("❌ Error enviando GIF:", err.message);
    // Si falla el video, enviar solo texto
    await reply(aviso(textoAccion), [sender, ...(targetJid !== sender ? [targetJid] : [])]);
  }
};
