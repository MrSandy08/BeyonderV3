import { create } from "yt-dlp-exec";
import fs from "fs";
import { join } from "path";
import { tmpdir } from "os";
import crypto from "crypto";
import config from "../config.js";

// Determinar el binario a usar (Hugging Face / Docker / Local)
const systemBinary = fs.existsSync("/usr/local/bin/yt-dlp") ? "/usr/local/bin/yt-dlp" : 
                    (fs.existsSync("/home/user/.local/bin/yt-dlp") ? "/home/user/.local/bin/yt-dlp" : "yt-dlp");
const ytExecutor = create(systemBinary);

/**
 * ── SERVICIO DE YOUTUBE 2026 (Anti-Blocking Core) ──
 * Implementa estrategias avanzadas contra errores 403 (Forbidden) y 410 (Gone).
 * Basado en yt-dlp con rotación de clientes y PO Tokens.
 */

// User-Agents realistas para simular navegadores modernos
const USER_AGENTS = [
  "com.google.android.apps.youtube.vr.oculus/1.65.10 (Linux; U; Android 12L; eureka-user Build/SQ3A.220605.009.A1) gzip",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
];

// Clientes de YouTube para rotación (evita bloqueos por IP/dispositivo)
const PLAYER_CLIENTS = ["android_vr", "ios", "android", "web_creator", "mweb"];

/**
 * Convierte cookies JSON (formato EditThisCookie/Chrome) a Netscape para yt-dlp
 */
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
    return jsonStr;
  }
};

/**
 * Ejecuta la actualización de yt-dlp
 */
export const updateYtDlp = async () => {
  try {
    console.log("🔄 Actualizando yt-dlp...");
    await ytExecutor("", { update: true });
    return { success: true, message: "yt-dlp actualizado a la última versión." };
  } catch (err) {
    console.error("❌ Error actualizando yt-dlp:", err.message);
    return { success: false, message: err.message };
  }
};

/**
 * Descarga un video/audio de YouTube con lógica de reintento avanzada
 */
export const downloadYouTube = async (url, type = "audio") => {
  const tempId = crypto.randomBytes(8).toString("hex");
  const ext = type === "audio" ? "mp3" : "mp4";
  const outputPath = join(tmpdir(), `ytdl_2026_${tempId}.${ext}`);
  const cookiePath = join(tmpdir(), `cookies_2026_${tempId}.txt`);

  let lastError = null;
  let attempts = 0;
  const maxAttempts = 3;

  // 1. Priorizar youtube_cookies.json (Sesión exitosa)
  const rootCookiesPath = join(process.cwd(), "youtube_cookies.json");
  if (fs.existsSync(rootCookiesPath)) {
    console.log("[YouTube] Usando youtube_cookies.json detectado en la raíz...");
    const netscapeCookies = jsonToNetscape(fs.readFileSync(rootCookiesPath, "utf-8"));
    fs.writeFileSync(cookiePath, netscapeCookies);
  } else if (config.YOUTUBE_COOKIES) {
    // 2. Fallback a variable de entorno
    const netscapeCookies = jsonToNetscape(config.YOUTUBE_COOKIES);
    fs.writeFileSync(cookiePath, netscapeCookies);
  }

  while (attempts < maxAttempts) {
    attempts++;
    const userAgent = USER_AGENTS[attempts % USER_AGENTS.length];
    const client = PLAYER_CLIENTS[attempts % PLAYER_CLIENTS.length];

    console.log(`[YouTube] Intento ${attempts}/${maxAttempts} usando cliente: ${client}...`);

    // 2026 Directives: PO Token y Visitor Data para saltar integridad
    let extractorArgs = `youtube:player_client=${client}`;
    if (config.PO_TOKEN && config.VISITOR_DATA) {
      extractorArgs += `;po_token=${config.PO_TOKEN}+${config.VISITOR_DATA}`;
    }

    const options = {
      output: outputPath,
      format: type === "audio" ? "bestaudio/best" : "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
      userAgent: userAgent,
      noCheckCertificates: true,
      noWarnings: true,
      // Directivas de 2026
      extractorArgs: extractorArgs,
      addHeader: [
        "sec-ch-ua: \"Not A(Brand\";v=\"99\", \"Google Chrome\";v=\"121\", \"Chromium\";v=\"121\"",
        "sec-ch-ua-mobile: ?0",
        "sec-ch-ua-platform: \"Windows\"",
        "Referer: https://www.youtube.com/"
      ],
      // Soporte para cookies desde el sistema (útil en local, no en HF)
      cookiesFromBrowser: config.COOKIES_BROWSER || undefined
    };

    // Limpiar caché de firmas si es el segundo intento (Error 410 Fix)
    if (attempts > 1) {
      options.rmCacheDir = true;
    }

    if (type === "audio") {
      options.extractAudio = true;
      options.audioFormat = "mp3";
    }

    if (fs.existsSync(cookiePath)) {
      options.cookies = cookiePath;
    }

    try {
      await ytExecutor(url, options);
      
      // Verificar si el archivo se generó correctamente
      if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
        if (fs.existsSync(cookiePath)) fs.unlinkSync(cookiePath);
        return { success: true, path: outputPath };
      }
    } catch (err) {
      lastError = err;
      console.warn(`⚠️ Intento ${attempts} falló: ${err.message}`);
      
      // Si es error 403 o 410, esperar un poco antes de reintentar con otro cliente
      if (err.message.includes("403") || err.message.includes("410")) {
        await new Promise(r => setTimeout(r, 2000 * attempts));
      } else {
        // Otros errores podrían no ser recuperables con rotación
        break;
      }
    }
  }

  if (fs.existsSync(cookiePath)) fs.unlinkSync(cookiePath);
  return { success: false, error: lastError?.message || "Error desconocido en la descarga." };
};
