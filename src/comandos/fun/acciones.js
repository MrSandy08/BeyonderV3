// src/comandos/fun/acciones.js
// Cubre más de 60 comandos de interacción usando múltiples APIs (nekos.best, waifu.pics, purrbot)
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

// ─── MAPEO DE APIs Y CONFIGURACIÓN DE ACCIONES ──────────────────────────────
const ACCIONES = {
  // --- NEKOS.BEST ---
  hug:      { api: "nekos", endpoint: "hug",      emoji: "🤗", textos: ["*{yo}* le da un abrazo enorme a *{target}*. 🤗", "*{yo}* envuelve a *{target}* en sus brazos. 💞"] },
  abrazo:   { api: "nekos", endpoint: "hug",      emoji: "🤗", textos: ["*{yo}* le da un abrazo enorme a *{target}*. 🤗", "*{yo}* envuelve a *{target}* en sus brazos. 💞"] },
  kiss:     { api: "nekos", endpoint: "kiss",     emoji: "💋", textos: ["*{yo}* le da un beso a *{target}*. 💋", "*{yo}* besa suavemente a *{target}*. 🌸"] },
  beso:     { api: "nekos", endpoint: "kiss",     emoji: "💋", textos: ["*{yo}* le da un beso a *{target}*. 💋", "*{yo}* besa suavemente a *{target}*. 🌸"] },
  pat:      { api: "nekos", endpoint: "pat",      emoji: "🥰", textos: ["*{yo}* le da palmaditas a *{target}*. 🥰", "*{yo}* acaricia a *{target}*. ✨"] },
  acariciar:{ api: "nekos", endpoint: "pat",      emoji: "🥰", textos: ["*{yo}* le da palmaditas a *{target}*. 🥰", "*{yo}* acaricia a *{target}*. ✨"] },
  slap:     { api: "nekos", endpoint: "slap",     emoji: "👋", textos: ["*{yo}* le dio una bofetada a *{target}*. 👋", "*{yo}* abofeteó a *{target}*. 😤"] },
  bofetada: { api: "nekos", endpoint: "slap",     emoji: "👋", textos: ["*{yo}* le dio una bofetada a *{target}*. 👋", "*{yo}* abofeteó a *{target}*. 😤"] },
  cuddle:   { api: "nekos", endpoint: "cuddle",   emoji: "🫂", textos: ["*{yo}* se acurruca con *{target}*. 🫂", "*{yo}* busca mimos de *{target}*. ✨"] },
  mimos:    { api: "nekos", endpoint: "cuddle",   emoji: "🫂", textos: ["*{yo}* se acurruca con *{target}*. 🫂", "*{yo}* busca mimos de *{target}*. ✨"] },
  tickle:   { api: "nekos", endpoint: "tickle",   emoji: "🤏", textos: ["*{yo}* le hace cosquillas a *{target}*. 🤏✨", "*{yo}* ataca con cosquillas a *{target}*. 😂"] },
  cosquillas:{ api: "nekos", endpoint: "tickle",  emoji: "🤏", textos: ["*{yo}* le hace cosquillas a *{target}*. 🤏✨", "*{yo}* ataca con cosquillas a *{target}*. 😂"] },
  smile:    { api: "nekos", endpoint: "smile",    emoji: "😊", textos: ["*{yo}* le sonríe a *{target}*. 😊", "*{yo}* muestra una bella sonrisa. ✨"] },
  sonreir:  { api: "nekos", endpoint: "smile",    emoji: "😊", textos: ["*{yo}* le sonríe a *{target}*. 😊", "*{yo}* muestra una bella sonrisa. ✨"] },
  wave:     { api: "nekos", endpoint: "wave",     emoji: "👋", textos: ["*{yo}* saluda a *{target}*. 👋", "*{yo}* dice hola. ✨"] },
  saludar:  { api: "nekos", endpoint: "wave",     emoji: "👋", textos: ["*{yo}* saluda a *{target}*. 👋", "*{yo}* dice hola. ✨"] },
  blush:    { api: "nekos", endpoint: "blush",    emoji: "😳", textos: ["*{yo}* se sonroja por culpa de *{target}*. 😳", "*{yo}* está muy apenado/a. ✨"] },
  sonrojar: { api: "nekos", endpoint: "blush",    emoji: "😳", textos: ["*{yo}* se sonroja por culpa de *{target}*. 😳", "*{yo}* está muy apenado/a. ✨"] },
  feed:     { api: "nekos", endpoint: "feed",     emoji: "🍲", textos: ["*{yo}* le da de comer a *{target}*. 🍲", "*{yo}* alimenta a *{target}*. ✨"] },
  alimentar:{ api: "nekos", endpoint: "feed",     emoji: "🍲", textos: ["*{yo}* le da de comer a *{target}*. 🍲", "*{yo}* alimenta a *{target}*. ✨"] },
  cry:      { api: "nekos", endpoint: "cry",      emoji: "😭", textos: ["*{yo}* llora frente a *{target}*. 😭", "*{yo}* no puede contener las lágrimas. 💔"] },
  llorar:   { api: "nekos", endpoint: "cry",      emoji: "😭", textos: ["*{yo}* llora frente a *{target}*. 😭", "*{yo}* no puede contener las lágrimas. 💔"] },
  dance:    { api: "nekos", endpoint: "dance",    emoji: "💃", textos: ["*{yo}* baila con *{target}*. 💃🕺", "*{yo}* se pone a bailar. ✨"] },
  bailar:   { api: "nekos", endpoint: "dance",    emoji: "💃", textos: ["*{yo}* baila con *{target}*. 💃🕺", "*{yo}* se pone a bailar. ✨"] },
  pout:     { api: "nekos", endpoint: "pout",     emoji: "😤", textos: ["*{yo}* le hace un puchero a *{target}*. 😤", "*{yo}* está molesto/a. ✨"] },
  puchero:  { api: "nekos", endpoint: "pout",     emoji: "😤", textos: ["*{yo}* le hace un puchero a *{target}*. 😤", "*{yo}* está molesto/a. ✨"] },
  shrug:    { api: "nekos", endpoint: "shrug",    emoji: "🤷", textos: ["*{yo}* no sabe qué decirle a *{target}*. 🤷", "*{yo}* se encoge de hombros. ✨"] },
  encogerse:{ api: "nekos", endpoint: "shrug",    emoji: "🤷", textos: ["*{yo}* no sabe qué decirle a *{target}*. 🤷", "*{yo}* se encoge de hombros. ✨"] },
  sleep:    { api: "nekos", endpoint: "sleep",    emoji: "😴", textos: ["*{yo}* se queda dormido/a junto a *{target}*. 😴", "*{yo}* se fue a mimir. ✨"] },
  dormir:   { api: "nekos", endpoint: "sleep",    emoji: "😴", textos: ["*{yo}* se queda dormido/a junto a *{target}*. 😴", "*{yo}* se fue a mimir. ✨"] },
  stare:    { api: "nekos", endpoint: "stare",    emoji: "👀", textos: ["*{yo}* se queda mirando a *{target}*. 👀", "*{yo}* observa fijamente. ✨"] },
  mirar:    { api: "nekos", endpoint: "stare",    emoji: "👀", textos: ["*{yo}* se queda mirando a *{target}*. 👀", "*{yo}* observa fijamente. ✨"] },
  think:    { api: "nekos", endpoint: "think",    emoji: "🤔", textos: ["*{yo}* piensa en lo que dijo *{target}*. 🤔", "*{yo}* está reflexionando. ✨"] },
  pensar:   { api: "nekos", endpoint: "think",    emoji: "🤔", textos: ["*{yo}* piensa en lo que dijo *{target}*. 🤔", "*{yo}* está reflexionando. ✨"] },
  thumbsup: { api: "nekos", endpoint: "thumbsup", emoji: "👍", textos: ["*{yo}* le da un pulgar arriba a *{target}*. 👍", "*{yo}* aprueba lo de *{target}*. ✨"] },
  aprobacion:{ api: "nekos", endpoint: "thumbsup", emoji: "👍", textos: ["*{yo}* le da un pulgar arriba a *{target}*. 👍", "*{yo}* aprueba lo de *{target}*. ✨"] },
  wink:     { api: "nekos", endpoint: "wink",     emoji: "😉", textos: ["*{yo}* le guiña un ojo a *{target}*. 😉", "*{yo}* lanza un guiño. ✨"] },
  guiño:    { api: "nekos", endpoint: "wink",     emoji: "😉", textos: ["*{yo}* le guiña un ojo a *{target}*. 😉", "*{yo}* lanza un guiño. ✨"] },
  bored:    { api: "nekos", endpoint: "bored",    emoji: "🥱", textos: ["*{yo}* está aburrido/a de *{target}*. 🥱", "*{yo}* bosteza de aburrimiento. ✨"] },
  aburrimiento:{ api: "nekos", endpoint: "bored", emoji: "🥱", textos: ["*{yo}* está aburrido/a de *{target}*. 🥱", "*{yo}* bosteza de aburrimiento. ✨"] },
  laugh:    { api: "nekos", endpoint: "laugh",    emoji: "😂", textos: ["*{yo}* se ríe de *{target}*. 😂", "*{yo}* no para de reír. ✨"] },
  risa:     { api: "nekos", endpoint: "laugh",    emoji: "😂", textos: ["*{yo}* se ríe de *{target}*. 😂", "*{yo}* no para de reír. ✨"] },
  punch:    { api: "waifu", endpoint: "slap",     emoji: "👊", textos: ["*{yo}* le da un puñetazo a *{target}*. 👊", "*{yo}* golpeó a *{target}*. 💥"] },
  puñetazo: { api: "waifu", endpoint: "slap",     emoji: "👊", textos: ["*{yo}* le da un puñetazo a *{target}*. 👊", "*{yo}* golpeó a *{target}*. 💥"] },
  poke:     { api: "nekos", endpoint: "poke",     emoji: "👉", textos: ["*{yo}* pica a *{target}*. 👉✨", "*{yo}* molesta a *{target}*. 😏"] },
  picar:    { api: "nekos", endpoint: "poke",     emoji: "👉", textos: ["*{yo}* pica a *{target}*. 👉✨", "*{yo}* molesta a *{target}*. 😏"] },
  yeet:     { api: "nekos", endpoint: "yeet",     emoji: "💨", textos: ["*{yo}* lanza a *{target}* muy lejos. 💨", "*{yo}* hizo un YEET con *{target}*. 🚀"] },
  lanzar:   { api: "nekos", endpoint: "yeet",     emoji: "💨", textos: ["*{yo}* lanza a *{target}* muy lejos. 💨", "*{yo}* hizo un YEET con *{target}*. 🚀"] },

  // --- WAIFU.PICS ---
  bully:    { api: "waifu", endpoint: "bully",    emoji: "😒", textos: ["*{yo}* molesta a *{target}*. 😒", "*{yo}* le hace bullying a *{target}*. ✨"] },
  molestar: { api: "waifu", endpoint: "bully",    emoji: "😒", textos: ["*{yo}* molesta a *{target}*. 😒", "*{yo}* le hace bullying a *{target}*. ✨"] },
  cringe:   { api: "waifu", endpoint: "cringe",   emoji: "😖", textos: ["*{yo}* siente cringe por *{target}*. 😖", "*{yo}* puso cara de asco. ✨"] },
  asco:     { api: "waifu", endpoint: "cringe",   emoji: "😖", textos: ["*{yo}* siente cringe por *{target}*. 😖", "*{yo}* puso cara de asco. ✨"] },
  highfive: { api: "waifu", endpoint: "highfive", emoji: "🙌", textos: ["*{yo}* choca los cinco con *{target}*. 🙌", "*{yo}* celebra con *{target}*. ✨"] },
  cinco:    { api: "waifu", endpoint: "highfive", emoji: "🙌", textos: ["*{yo}* choca los cinco con *{target}*. 🙌", "*{yo}* celebra con *{target}*. ✨"] },
  happy:    { api: "waifu", endpoint: "happy",    emoji: "✨", textos: ["*{yo}* está feliz con *{target}*. ✨", "*{yo}* irradia alegría. 💖"] },
  feliz:    { api: "waifu", endpoint: "happy",    emoji: "✨", textos: ["*{yo}* está feliz con *{target}*. ✨", "*{yo}* irradia alegría. 💖"] },
  kill:     { api: "waifu", endpoint: "kill",     emoji: "💀", textos: ["*{yo}* acaba con *{target}*. 💀", "*{yo}* eliminó a *{target}*. ⚰️"] },
  matar:    { api: "waifu", endpoint: "kill",     emoji: "💀", textos: ["*{yo}* acaba con *{target}*. 💀", "*{yo}* eliminó a *{target}*. ⚰️"] },
  lick:     { api: "waifu", endpoint: "lick",     emoji: "👅", textos: ["*{yo}* lame a *{target}*. 👅", "*{yo}* le dio una lamiidita a *{target}*. 😏"] },
  lamer:    { api: "waifu", endpoint: "lick",     emoji: "👅", textos: ["*{yo}* lame a *{target}*. 👅", "*{yo}* le dio una lamiidita a *{target}*. 😏"] },
  bite:     { api: "waifu", endpoint: "bite",     emoji: "😈", textos: ["*{yo}* muerde a *{target}*. 😈", "*{yo}* clavó sus dientes en *{target}*. ✨"] },
  morder:   { api: "waifu", endpoint: "bite",     emoji: "😈", textos: ["*{yo}* muerde a *{target}*. 😈", "*{yo}* clavó sus dientes en *{target}*. ✨"] },
  glare:    { api: "waifu", endpoint: "glare",    emoji: "😠", textos: ["*{yo}* mira feo a *{target}*. 😠", "*{yo}* le lanza una mirada asesina. 💢"] },
  mirada:   { api: "waifu", endpoint: "glare",    emoji: "😠", textos: ["*{yo}* mira feo a *{target}*. 😠", "*{yo}* le lanza una mirada asesina. 💢"] },
  nom:      { api: "waifu", endpoint: "nom",      emoji: "😋", textos: ["*{yo}* muerde a *{target}* (nom). 😋", "*{yo}* hace nom nom con *{target}*. ✨"] },
  comer:    { api: "waifu", endpoint: "nom",      emoji: "😋", textos: ["*{yo}* muerde a *{target}* (nom). 😋", "*{yo}* hace nom nom con *{target}*. ✨"] },
  handhold: { api: "waifu", endpoint: "handhold", emoji: "🤝", textos: ["*{yo}* toma la mano de *{target}*. 🤝", "*{yo}* entrelaza sus dedos con *{target}*. 💖"] },
  mano:     { api: "waifu", endpoint: "handhold", emoji: "🤝", textos: ["*{yo}* toma la mano de *{target}*. 🤝", "*{yo}* entrelaza sus dedos con *{target}*. 💖"] },

  // --- PURRBOT ---
  backrub:  { api: "purr", endpoint: "pat",       emoji: "💆", textos: ["*{yo}* le da un masaje en la espalda a *{target}*. 💆", "*{yo}* relaja a *{target}*. ✨"] },
  masaje_espalda:{ api: "purr", endpoint: "pat",  emoji: "💆", textos: ["*{yo}* le da un masaje en la espalda a *{target}*. 💆", "*{yo}* relaja a *{target}*. ✨"] },
  headrub:  { api: "purr", endpoint: "pat",       emoji: "💆‍♂️", textos: ["*{yo}* le acaricia la cabeza a *{target}*. 💆‍♂️", "*{yo}* mima a *{target}*. ✨"] },
  masaje_cabeza:{ api: "purr", endpoint: "pat",   emoji: "💆‍♂️", textos: ["*{yo}* le acaricia la cabeza a *{target}*. 💆‍♂️", "*{yo}* mima a *{target}*. ✨"] },
  insult:   { api: "nekos", endpoint: "baka",     emoji: "🖕", textos: ["*{yo}* insulta a *{target}*. 🖕", "*{yo}* le dijo de todo a *{target}*. 💢"] },
  insultar: { api: "nekos", endpoint: "baka",     emoji: "🖕", textos: ["*{yo}* insulta a *{target}*. 🖕", "*{yo}* le dijo de todo a *{target}*. 💢"] },
  kisscheek:{ api: "nekos", endpoint: "peck",     emoji: "😘", textos: ["*{yo}* le da un beso en la mejilla a *{target}*. 😘", "*{yo}* besa la cara de *{target}*. ✨"] },
  beso_mejilla:{ api: "nekos", endpoint: "peck",  emoji: "😘", textos: ["*{yo}* le da un beso en la mejilla a *{target}*. 😘", "*{yo}* besa la cara de *{target}*. ✨"] },
  massage:  { api: "purr", endpoint: "pat",       emoji: "💆‍♀️", textos: ["*{yo}* le da un masaje a *{target}*. 💆‍♀️", "*{yo}* consiente a *{target}*. ✨"] },
  masaje:   { api: "purr", endpoint: "pat",       emoji: "💆‍♀️", textos: ["*{yo}* le da un masaje a *{target}*. 💆‍♀️", "*{yo}* consiente a *{target}*. ✨"] },
  spank:    { api: "waifu", endpoint: "bonk",     emoji: "🍑", textos: ["*{yo}* le da una nalgada a *{target}*. 🍑💨", "*{yo}* castigó a *{target}*. 😏"] },
  nalgada:  { api: "waifu", endpoint: "bonk",     emoji: "🍑", textos: ["*{yo}* le da una nalgada a *{target}*. 🍑💨", "*{yo}* castigó a *{target}*. 😏"] },
  tail:     { api: "purr", endpoint: "dance",     emoji: "🐈", textos: ["*{yo}* mueve la cola frente a *{target}*. 🐈", "*{yo}* menea su colita. ✨"] },
  cola:     { api: "purr", endpoint: "dance",     emoji: "🐈", textos: ["*{yo}* mueve la cola frente a *{target}*. 🐈", "*{yo}* menea su colita. ✨"] },
  vibe:     { api: "nekos", endpoint: "dance",    emoji: "🎵", textos: ["*{yo}* vibra junto a *{target}*. 🎵", "*{yo}* está en el mismo mood que *{target}*. ✨"] },
  vibrar:   { api: "nekos", endpoint: "dance",    emoji: "🎵", textos: ["*{yo}* vibra junto a *{target}*. 🎵", "*{yo}* está en el mismo mood que *{target}*. ✨"] },
  attack:   { api: "waifu", endpoint: "kill",     emoji: "⚔️", textos: ["*{yo}* ataca a *{target}*. ⚔️", "*{yo}* se lanza contra *{target}*. 💢"] },
  atacar:   { api: "waifu", endpoint: "kill",     emoji: "⚔️", textos: ["*{yo}* ataca a *{target}*. ⚔️", "*{yo}* se lanza contra *{target}*. 💢"] },
  dodge:    { api: "nekos", endpoint: "shrug",    emoji: "💨", textos: ["*{yo}* esquiva el ataque de *{target}*. 💨", "*{yo}* fue muy rápido para *{target}*. ✨"] },
  esquivar: { api: "nekos", endpoint: "shrug",    emoji: "💨", textos: ["*{yo}* esquiva el ataque de *{target}*. 💨", "*{yo}* fue muy rápido para *{target}*. ✨"] },
  shoot:    { api: "waifu", endpoint: "kill",     emoji: "🔫", textos: ["*{yo}* le dispara a *{target}*. 🔫", "*{yo}* abrió fuego contra *{target}*. 💥"] },
  disparar: { api: "waifu", endpoint: "kill",     emoji: "🔫", textos: ["*{yo}* le dispara a *{target}*. 🔫", "*{yo}* abrió fuego contra *{target}*. 💥"] },
  stab:     { api: "waifu", endpoint: "kill",     emoji: "🔪", textos: ["*{yo}* apuñala a *{target}*. 🔪", "*{yo}* hirió a *{target}* con una daga. 🩸"] },
  apuñalar: { api: "waifu", endpoint: "kill",     emoji: "🔪", textos: ["*{yo}* apuñala a *{target}*. 🔪", "*{yo}* hirió a *{target}* con una daga. 🩸"] },

  // --- ESPECIALES ---
  sex:      { api: "purr", endpoint: "cuddle",   emoji: "🔥", textos: ["🔥 *{yo}* y *{target}* se entregan al deseo en un encuentro apasionado... 😏", "*{yo}* y *{target}* están en pleno acto, la temperatura no para de subir. 🔥😏", "¡Qué intensidad! *{yo}* y *{target}* se dejan llevar por la lujuria del momento. 🫦✨", "🔥 *{yo}* domina a *{target}* mientras ambos exploran sus instintos más profundos... ¡Uff! 😏"] },
  sexo:     { api: "purr", endpoint: "cuddle",   emoji: "🔥", textos: ["🔥 *{yo}* y *{target}* se entregan al deseo en un encuentro apasionado... 😏", "*{yo}* y *{target}* están en pleno acto, la temperatura no para de subir. 🔥😏", "¡Qué intensidad! *{yo}* y *{target}* se dejan llevar por la lujuria del momento. 🫦✨", "🔥 *{yo}* domina a *{target}* mientras ambos exploran sus instintos más profundos... ¡Uff! 😏"] },
  carry:    { api: "nekos", endpoint: "hug",      emoji: "🏋️", textos: ["¡*{yo}* ha tomado a *{target}* en sus brazos! 🏋️", "*{yo}* carga a *{target}* con facilidad. 💪"] },
  cargar:   { api: "nekos", endpoint: "hug",      emoji: "🏋️", textos: ["¡*{yo}* ha tomado a *{target}* en sus brazos! 🏋️", "*{yo}* carga a *{target}* con facilidad. 💪"] },
  pback:    { api: "nekos", endpoint: "pat",      emoji: "🐎", textos: ["¡*{yo}* se ha subido a la espalda de *{target}*! ¡Arre! 🐎", "*{yo}* cabalga sobre *{target}*. ✨"] },
  caballito:{ api: "nekos", endpoint: "pat",      emoji: "🐎", textos: ["¡*{yo}* se ha subido a la espalda de *{target}*! ¡Arre! 🐎", "*{yo}* cabalga sobre *{target}*. ✨"] },
  kabedon:  { api: "nekos", endpoint: "hug",      emoji: "🫦", textos: ["*{yo}* acorrala a *{target}* contra la pared. 🫦", "*{yo}* domina a *{target}* con un kabedon. 🔥"] },
  acorralar:{ api: "nekos", endpoint: "hug",      emoji: "🫦", textos: ["*{yo}* acorrala a *{target}* contra la pared. 🫦", "*{yo}* domina a *{target}* con un kabedon. 🔥"] },
};

// ─── OBTENER GIF SEGÚN API ───────────────────────────────────────────────────
async function fetchGif(config) {
  try {
    let url = "";
    if (config.api === "nekos") {
      const res = await axios.get(`https://nekos.best/api/v2/${config.endpoint}?amount=1`, { timeout: 8000 });
      url = res.data?.results?.[0]?.url;
    } else if (config.api === "waifu") {
      const res = await axios.get(`https://api.waifu.pics/sfw/${config.endpoint}`, { timeout: 8000 });
      url = res.data?.url;
    } else if (config.api === "purr") {
      const res = await axios.get(`https://purrbot.site/api/img/sfw/${config.endpoint}/gif`, { timeout: 8000 });
      url = res.data?.link;
    }
    return url || null;
  } catch (_) { return null; }
}

async function downloadBuffer(url) {
  try {
    const res = await axios.get(url, { responseType: "arraybuffer", timeout: 15000 });
    return Buffer.from(res.data);
  } catch (_) { return null; }
}

const numFromJid   = (jid) => jid?.split("@")[0] || jid;
const primerNombre = (n)   => n?.split(" ")[0] || n || "???";
const pick         = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const name      = "acciones";
export const aliases   = Object.keys(ACCIONES);
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

export const run = async (contexto) => {
  const { reply, react, sender, from, sock, msg, args, communityId } = contexto;

  const rawBody = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || "").trim().toLowerCase().split(/\s+/)[0].slice(1);
  const accion = ACCIONES[rawBody];
  if (!accion) return;

  const targetJid = await userTarget(contexto, User);
  const targetEspecificado = args.length > 0 || msg.message?.extendedTextMessage?.contextInfo?.participant;

  let nombreYo     = `@${numFromJid(sender)}`;
  let nombreTarget = (targetJid === sender && !targetEspecificado) ? "sí mismo" : `@${numFromJid(targetJid)}`;

  const dbYo     = await User.findOne({ jid: sender, communityId }).select("personaje").lean();
  const dbTarget = (targetJid === sender && !targetEspecificado) ? null : await User.findOne({ jid: targetJid, communityId }).select("personaje").lean();

  if (dbYo?.personaje)     nombreYo     = primerNombre(dbYo.personaje);
  if (dbTarget?.personaje) nombreTarget = primerNombre(dbTarget.personaje);

  const textoAccion = pick(accion.textos).replace("{yo}", nombreYo).replace("{target}", nombreTarget);

  await react(accion.emoji);
  const gifUrl = await fetchGif(accion);

  if (!gifUrl) return reply(aviso(textoAccion));

  let buffer = await downloadBuffer(gifUrl);
  if (!buffer) return reply(aviso(textoAccion));

  let finalBuffer = buffer;
  try {
    finalBuffer = await gifToMp4(buffer);
  } catch (err) {
    console.error("⚠️ Error conversión:", err.message);
  }

  const caption = `                 𑂯 ( ${accion.emoji} ) ⁺ 𓈒  ׁ     \n 𝄄➥ _${textoAccion}_\n       𝄄   @𝐀𝗍𝗍𝖾 : ℬeyonder`;

  try {
    await sock.sendMessage(from, {
      video: finalBuffer,
      mimetype: "video/mp4",
      caption,
      gifPlayback: true,
      mentions: [sender, ...(targetJid !== sender ? [targetJid] : [])],
    }, { quoted: msg });
  } catch (err) {
    await reply(aviso(textoAccion), [sender, ...(targetJid !== sender ? [targetJid] : [])]);
  }
};
