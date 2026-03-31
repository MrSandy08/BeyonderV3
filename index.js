import "dotenv/config";  // ← PRIMERA LÍNEA, antes de todo
// index.js — Beyonder v3 | Punto de entrada principal
import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import { useMongoDBAuthState } from "./src/utils/mongoAuthState.js";
import { MongoClient } from "mongodb";
import { Boom } from "@hapi/boom";
import pino from "pino";
import qrcode from "qrcode-terminal";

import connectDB      from "./src/database/connection.js";
import { MONGO_URI, PORT, PHONE_NUMBER } from "./src/config.js";
import cargarComandos from "./src/handlers/commandHandler.js";
import handleMessages from "./src/events/messages.js";

// ════════════════════════════════════════════════════════════════════════════
//  1. CONEXIÓN A WHATSAPP (Baileys)
// ════════════════════════════════════════════════════════════════════════════
let mongoClient = null;

import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

const conectarWhatsApp = async (comandos) => {
  try {
    if (!mongoClient) {
      console.log("Intentando conectar a DB para sesión...");
      mongoClient = new MongoClient(MONGO_URI);
      await mongoClient.connect();
      console.log("✅ Cliente MongoDB para sesión listo.");
    }

    const db = mongoClient.db("BeyonderV3");
    const collection = db.collection("auth");

    const { state, saveCreds } = await useMongoDBAuthState(collection);
    const { version }          = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth:                state,
      logger:              pino({ level: "silent" }),
      markOnlineOnConnect: false,
      printQRInTerminal:   !PHONE_NUMBER, // Solo imprime QR si NO hay número para vincular
    });

    // ── Lógica de Código de Vinculación (Pairing Code) ───────────────────────
    if (PHONE_NUMBER && !sock.authState.creds.registered) {
      console.log(`\n📲 Generando código de vinculación para: ${PHONE_NUMBER}`);
      setTimeout(async () => {
        try {
          const code = await sock.requestPairingCode(PHONE_NUMBER);
          console.log(`\n🔗 TU CÓDIGO DE VINCULACIÓN ES: \x1b[32m${code}\x1b[0m\n`);
        } catch (e) {
          console.error("❌ Error al solicitar código de vinculación:", e.message);
        }
      }, 3000); // Pequeño delay para asegurar que el socket esté listo
    }

    // ── Guardar credenciales al actualizarse ────────────────────────────────
    sock.ev.on("creds.update", saveCreds);

    // ── Gestión de la conexión / reconexión ─────────────────────────────────
    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr && !PHONE_NUMBER) {
        console.log("\n📱 Escanea este QR con tu WhatsApp:\n");
        qrcode.generate(qr, { small: true });
      }

      if (connection === "open") {
        console.log("✅ WhatsApp conectado correctamente.\n");

        // ── Notificación de Actualización (Git Commit) ──────────────────────
        (async () => {
          try {
            const { stdout } = await execPromise("git log -1 --pretty=%B");
            const lastCommit = stdout.trim();
            const adminJid = config.OWNERS[0]; // Usar el primer owner como admin principal
            
            if (adminJid) {
              await sock.sendMessage(adminJid, { text: `🚀 *Beyonder Actualizado*\n\n📝 *Commit:* ${lastCommit}` });
              console.log("✅ Notificación de actualización enviada.");
            }
          } catch (e) {
            console.warn("⚠️ No se pudo obtener el log de Git o enviar la notificación.");
          }
        })();
      }

      if (connection === "close") {
        const error = lastDisconnect?.error;
        const boom = new Boom(error);
        const codigo = boom?.output?.statusCode;
        const reason = error?.message || "Desconocida";
        
        console.log(`❌ Conexión cerrada. Razón: ${reason} | Código: ${codigo}`);

        const debeReconectar = codigo !== DisconnectReason.loggedOut;

        if (debeReconectar) {
          const delay = 5000;
          console.log(`🔄 Reconectando en ${delay/1000}s...`);
          // Limpiar client si existe para forzar nueva conexión
          if (mongoClient && codigo === DisconnectReason.connectionLost) {
            console.log("⚠️ Conexión perdida, reintentando con nuevo cliente...");
          }
          setTimeout(() => conectarWhatsApp(comandos), delay);
        } else {
          console.log("🚪 Sesión cerrada permanentemente (Logged Out).");
        }
      }
    });

    // ════════════════════════════════════════════════════════════════════════
    //  2. ESCUCHADOR DE MENSAJES
    // ════════════════════════════════════════════════════════════════════════
    sock.ev.on("messages.upsert", (upsert) =>
      handleMessages(upsert, sock, comandos)
    );

    return sock;
  } catch (err) {
    console.error("❌ Error fatal en conectarWhatsApp:", err.message);
    setTimeout(() => conectarWhatsApp(comandos), 10000);
  }
};

// ════════════════════════════════════════════════════════════════════════════
//  3. ARRANQUE PRINCIPAL
//     Orden garantizado: BD → Comandos → WhatsApp
// ════════════════════════════════════════════════════════════════════════════
const main = async () => {
  console.log("🚀 Iniciando Beyonder v3...\n");

  // 1. Base de datos primero — si falla, el proceso termina (ver connection.js)
  console.log("Intentando conectar a DB...");
  if (MONGO_URI.includes("127.0.0.1") || MONGO_URI.includes("localhost")) {
    console.log("ℹ️ Usando conexión local.");
  } else {
    console.log("✅ Detectada variable MONGO_URI externa.");
  }
  await connectDB();

  // 2. Cargar todos los comandos antes de abrir el socket
  console.log("📂 Cargando comandos...");
  const comandos = await cargarComandos();

  // 3. Conectar a WhatsApp
  await conectarWhatsApp(comandos);
};

main();