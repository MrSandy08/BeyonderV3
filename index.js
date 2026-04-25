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
import qrcodeTerminal from "qrcode-terminal";
import qrcode from "qrcode";
import fs from "fs";

import connectDB      from "./src/database/connection.js";
import config         from "./src/config.js";
import pluginLoader   from "./src/classes/PluginLoader.js";
import handleMessages from "./src/events/messages.js";
import { init }        from "./src/index.js";
import { handleGroupParticipantsUpdate, handleGroupUpdate } from "./src/events/groupUpdate.js";
import { checkGroupInactivity } from "./src/services/initiativeService.js";
import { startDashboard } from "./src/dashboard/server.js";

import UserClass      from "./src/classes/User.js";

const { MONGO_URI, PORT, PHONE_NUMBER, OWNERS } = config;

// ── Manejo Global de Errores para evitar crasheos por Connection Closed ─────
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection en:", promise, "razón:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  // No salimos del proceso para que el loop de reconexión de Baileys trabaje
});

// ════════════════════════════════════════════════════════════════════════════
//  1. CONEXIÓN A WHATSAPP (Baileys)
// ════════════════════════════════════════════════════════════════════════════
let mongoClient = null;
let currentSock = null;

import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

const conectarWhatsApp = async () => {
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
      printQRInTerminal:   false, 
      connectTimeoutMs:    60000,
      keepAliveIntervalMs: 30000,
    });

    currentSock = sock;

    // ── Lógica de Código de Vinculación (Pairing Code) ───────────────────────
    if (PHONE_NUMBER && !sock.authState.creds.registered) {
      console.log(`\n📲 MODO PAIRING CODE: Solicitando código para ${PHONE_NUMBER}...`);
      setTimeout(async () => {
        try {
          const code = await sock.requestPairingCode(PHONE_NUMBER);
          console.log(`\n🔗 TU CÓDIGO DE VINCULACIÓN ES: \x1b[32m${code}\x1b[0m\n`);
          // También guardar en un archivo para acceso web
          fs.writeFileSync("./pairing.txt", code);
        } catch (e) {
          console.error("❌ Error al solicitar código de vinculación:", e.message);
        }
      }, 5000); 
    }

    // ── Guardar credenciales al actualizarse ────────────────────────────────
    sock.ev.on("creds.update", saveCreds);

    // ── Gestión de la conexión / reconexión ─────────────────────────────────
    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log("\n📱 NUEVO QR GENERADO. Escanea con tu WhatsApp:\n");
        qrcodeTerminal.generate(qr, { small: true });

        // Guardar QR como imagen para visualización en web (HF Spaces)
        try {
          await qrcode.toFile("./qr.png", qr);
          console.log("🖼️ QR guardado como qr.png en la raíz.");
        } catch (e) {
          console.error("❌ Error al guardar QR como imagen:", e.message);
        }
      }

      if (connection === "open") {
        console.log("✅ WhatsApp conectado correctamente.\n");
        // Borrar archivos temporales al conectar
        if (fs.existsSync("./qr.png")) fs.unlinkSync("./qr.png");
        if (fs.existsSync("./pairing.txt")) fs.unlinkSync("./pairing.txt");
      }

      if (connection === "close") {
        const error = lastDisconnect?.error;
        const boom = new Boom(error);
        const codigo = boom?.output?.statusCode;
        const reason = error?.message || "Desconocida";
        
        console.log(`❌ Conexión cerrada. Razón: ${reason} | Código: ${codigo}`);

        // Si el código es 401 (loggedOut), eliminamos sesión.
        // Pero a veces Baileys da otros códigos en cierres normales de HF.
        const debeReconectar = codigo !== DisconnectReason.loggedOut && codigo !== 401;

        if (debeReconectar) {
          const delay = 5000;
          console.log(`🔄 Reconectando en ${delay/1000}s...`);
          setTimeout(() => conectarWhatsApp(), delay);
        } else {
          console.log("🚪 Sesión cerrada definitivamente (Logged Out). Limpiando datos de autenticación...");
          try {
            // Como usamos MongoDB para auth, borramos la colección 'auth'
            await collection.deleteMany({});
            console.log("✅ Datos de sesión borrados de MongoDB. Reiniciando bot para generar nuevo acceso...");
            setTimeout(() => conectarWhatsApp(), 2000);
          } catch (e) {
            console.error("❌ Error al limpiar sesión en MongoDB:", e.message);
          }
        }
      }
    });

    // ════════════════════════════════════════════════════════════════════════
    //  2. ESCUCHADOR DE MENSAJES
    // ════════════════════════════════════════════════════════════════════════
    sock.ev.on("messages.upsert", (upsert) =>
      handleMessages(upsert, sock)
    );

    // ── Gestión de Eventos de Grupo ──────────────────────────────────────────
    sock.ev.on("group-participants.update", (update) => 
      handleGroupParticipantsUpdate(update, sock)
    );

    sock.ev.on("groups.update", (updates) => 
      handleGroupUpdate(updates, sock)
    );

    // ── 3. SISTEMA DE INICIATIVA (Cada 1 hora) ───────────────────────────────
    setInterval(() => checkGroupInactivity(sock), 60 * 60 * 1000);

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
  console.log("🚀 Iniciando Beyonder v4 (HF Spaces Optimized)...\n");

  try {
    // 1. Iniciar Dashboard INMEDIATAMENTE
    // HF Spaces mata el contenedor si el puerto 7860 no abre en < 60s.
    console.log("🌐 [1/4] Abriendo puerto 7860 (Dashboard)...");
    startDashboard(() => currentSock);

    // 2. Base de datos (con timeout de seguridad)
    console.log("📂 [2/4] Conectando a MongoDB & Redis...");
    if (!MONGO_URI) {
      console.error("❌ ERROR: MONGO_URI no configurada en las Secret Vars de HF.");
      process.exit(1);
    }
    await connectDB();

    // 3. Inicializar Core V4 (Carga de Comandos, Schedulers, Módulos)
    console.log("📂 [3/4] Inicializando Core Beyonder V4...");
    await init();

    // 4. Conectar a WhatsApp
    console.log("📲 [4/4] Iniciando socket de WhatsApp...");
    await conectarWhatsApp();

  } catch (err) {
    console.error("❌ ERROR CRÍTICO DURANTE EL ARRANQUE:", err.message);
    // En HF Spaces es mejor no salir para que el Dashboard siga vivo y podamos ver el error en el log web
    // Pero si no hay conexión a DB, el bot no sirve de nada.
  }
};

main();

// ── 5. MANEJO DE CIERRE (Emergency Sync) ───────────────────────────────────
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Recibido ${signal}. Iniciando guardado de emergencia...`);
  try {
    // Sincronizar datos de usuarios de Redis a Mongo antes de salir
    await UserClass.syncAllToDB();
    console.log("✅ Datos sincronizados correctamente. Cerrando bot...");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error durante el guardado de emergencia:", err.message);
    process.exit(1);
  }
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));