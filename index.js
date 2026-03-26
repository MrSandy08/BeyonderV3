import "dotenv/config";  // ← PRIMERA LÍNEA, antes de todo
// index.js — Beyonder v3 | Punto de entrada principal
import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import { useMongoDBAuthState } from "mongo-baileys";
import { MongoClient } from "mongodb";
import { Boom } from "@hapi/boom";
import pino from "pino";
import qrcode from "qrcode-terminal";

import connectDB      from "./src/database/connection.js";
import config         from "./src/config.js";
import cargarComandos from "./src/handlers/commandHandler.js";
import handleMessages from "./src/events/messages.js";

// ════════════════════════════════════════════════════════════════════════════
//  1. CONEXIÓN A WHATSAPP (Baileys)
// ════════════════════════════════════════════════════════════════════════════
const conectarWhatsApp = async (comandos) => {

  const client = new MongoClient(config.MONGO_URI);
  await client.connect();
  const db = client.db("BeyonderV3");
  const collection = db.collection("auth");

  const { state, saveCreds } = await useMongoDBAuthState(collection);
  const { version }          = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth:                state,
    logger:              pino({ level: "silent" }),
    markOnlineOnConnect: false,
  });

  // ── Guardar credenciales al actualizarse ────────────────────────────────
  sock.ev.on("creds.update", saveCreds);

  // ── Gestión de la conexión / reconexión ─────────────────────────────────
  sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log("\n📱 Escanea este QR con tu WhatsApp:\n");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "open") {
      console.log("✅ WhatsApp conectado correctamente.\n");
    }

    if (connection === "close") {
      const codigo  = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const reconectar = codigo !== DisconnectReason.loggedOut;

      if (reconectar) {
        console.log("🔄 Reconectando a WhatsApp...");
        conectarWhatsApp(comandos); // reintento recursivo
      } else {
        console.log("🚪 Sesión cerrada. Borra la carpeta auth_info_baileys y reinicia.");
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
};

// ════════════════════════════════════════════════════════════════════════════
//  3. ARRANQUE PRINCIPAL
//     Orden garantizado: BD → Comandos → WhatsApp
// ════════════════════════════════════════════════════════════════════════════
const main = async () => {
  console.log("🚀 Iniciando Beyonder v3...\n");

  // 1. Base de datos primero — si falla, el proceso termina (ver connection.js)
  console.log("Intentando conectar a DB...");
  if (config.MONGO_URI.includes("127.0.0.1") || config.MONGO_URI.includes("localhost")) {
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