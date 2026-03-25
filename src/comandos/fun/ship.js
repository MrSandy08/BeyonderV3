
import User from "../../database/models/User.js";
import { aviso, progressBar } from "../../utils/format.js";
import userTarget from "../../utils/userTarget.js";
import axios from "axios";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "ffmpeg-static";
import { promises as fs } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import crypto from "crypto";

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

export const name      = "ship";
export const aliases   = ["love"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

const TIERS = [
  { 
    min: 0, 
    max: 20, 
    label: "Zona del Desastre 💔", 
    msg: "Huyan... esto es un desastre inminente.", 
    search: "nope anime" 
  },
  { 
    min: 21, 
    max: 45, 
    label: "Solo Amigos... y a veces 🙃", 
    msg: "La chispa existe, pero es más como electricidad estática. Prueben siendo amigos.", 
    search: "friendzone anime" 
  },
  { 
    min: 46, 
    max: 70, 
    label: "Hay Potencial 😌", 
    msg: "¡Oye, esto no se ve nada mal! Podría funcionar si se esfuerzan.", 
    search: "cute smile anime" 
  },
  { 
    min: 71, 
    max: 90, 
    label: "Pareja Ardiente 🔥", 
    msg: "¡Wao! Hay química aquí. ¡Pidan una habitación!", 
    search: "spicy kiss anime" 
  },
  { 
    min: 91, 
    max: 100, 
    label: "Almas Gemelas 💍", 
    msg: "¡BODA CONFIRMADA! Son el uno para el otro. El destino los unió.", 
    search: "wedding anime" 
  }
];

export const run = async (contexto) => {
  const { reply, sender, from, args, sock, msg, mentionedJids } = contexto;

  // Detectar objetivos
  let u1 = sender;
  let u2 = null;

  // Si hay menciones, usarlas
  if (mentionedJids && mentionedJids.length >= 2) {
    u1 = mentionedJids[0];
    u2 = mentionedJids[1];
  } else if (mentionedJids && mentionedJids.length === 1) {
    u2 = mentionedJids[0];
  } else {
    // Si no hay menciones, usar userTarget para el segundo objetivo
    u2 = await userTarget(contexto, User);
  }

  if (!u2 || u1 === u2) {
    return reply(aviso("Etiqueta a dos personas o a una para shipearte con ella."));
  }

  // Generar porcentaje consistente por día para la misma pareja
  const seed = [u1, u2].sort().join("") + new Date().toISOString().split("T")[0];
  const hash = crypto.createHash("md5").update(seed).digest("hex");
  const porcentaje = parseInt(hash.substring(0, 8), 16) % 101;

  const tier = TIERS.find(t => porcentaje >= t.min && porcentaje <= t.max);

  // Obtener nombres
  const db1 = await User.findOne({ jid: u1, groupId: from }).select("personaje").lean();
  const db2 = await User.findOne({ jid: u2, groupId: from }).select("personaje").lean();

  const n1 = db1?.personaje || `@${u1.split("@")[0]}`;
  const n2 = db2?.personaje || `@${u2.split("@")[0]}`;

  // Obtener GIF de nekos.best (o Giphy/Tenor si fuera posible, pero nekos.best es más directo)
  let videoBuffer = null;
  try {
    const res = await axios.get(`https://nekos.best/api/v2/${tier.search.split(" ")[0]}`);
    const gifUrl = res.data.results[0].url;
    const gifRes = await axios.get(gifUrl, { responseType: "arraybuffer" });
    videoBuffer = await gifToMp4(gifRes.data);
  } catch (e) {
    console.error("Error obteniendo GIF para !ship:", e);
  }

  const bar = progressBar(porcentaje, 15);
  const texto = 
    `   ⤷ ˚₊‧ ‧₊˚  *S H I P P E O*  ˚₊‧ ‧₊˚\n` +
    `    *${n1}*   &   *${n2}*\n` +
    `  ${bar}\n\n` +
    `  ${tier.label}\n` +
    `  _${tier.msg}_`;

  if (videoBuffer) {
    await sock.sendMessage(from, {
      video: videoBuffer,
      caption: texto,
      gifPlayback: true,
      mentions: [u1, u2]
    });
  } else {
    await reply(texto, [u1, u2]);
  }
};
