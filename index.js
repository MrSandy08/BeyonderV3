import "dotenv/config";
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
import { initCore }      from "./src/index.js";
import { handleGroupParticipantsUpdate, handleGroupUpdate } from "./src/events/groupUpdate.js";
import { startDashboard } from "./src/dashboard/server.js";

import UserClass      from "./src/classes/User.js";

const { MONGO_URI, PORT, PHONE_NUMBER, OWNERS } = config;

let sock = null;

const getSock = () => sock;

async function startBot() {
  console.log("🚀 Iniciando Beyonder v3...");

  // 1. Conectar a bases de datos
  await connectDB();

  // 2. Inicializar núcleo del bot (comandos, módulos)
  await initCore();
  await pluginLoader.loadAll();

  // 3. Configurar conexión a WhatsApp
  const mongoClient = new MongoClient(MONGO_URI);
  await mongoClient.connect();
  const db = mongoClient.db();
  const { state, saveCreds } = await useMongoDBAuthState(db.collection("auth"));

  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`📱 Versión de Baileys: ${version.join('.')} (${isLatest ? 'última' : 'obsoleta'})`);

  sock = makeWASocket({
    version,
    printQRInTerminal: false,
    auth: state,
    logger: pino({ level: "silent" }),
    browser: ["Beyonder v3", "Chrome", "120.0.0.0"],
    syncFullHistory: false,
    markOnlineOnConnect: true,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, qr, lastDisconnect, pairingCode } = update;

    if (pairingCode) {
      console.log("📱 Código de vinculación:", pairingCode);
      try {
        await fs.promises.writeFile("pairing.txt", pairingCode);
      } catch (e) {
        console.warn("⚠️ No se pudo guardar el código en archivo:", e.message);
      }
    }

    if (connection === "close") {
      const shouldReconnect = (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log("❌ Conexión cerrada:", lastDisconnect?.error?.message || "Sin error");
      
      if (fs.existsSync("qr.png")) fs.unlinkSync("qr.png");
      if (fs.existsSync("pairing.txt")) fs.unlinkSync("pairing.txt");

      if (shouldReconnect) {
        console.log("🔄 Reconectando...");
        startBot();
      }
    } else if (connection === "open") {
      console.log("✅ Conectado a WhatsApp!");
      if (fs.existsSync("qr.png")) fs.unlinkSync("qr.png");
      if (fs.existsSync("pairing.txt")) fs.unlinkSync("pairing.txt");
      
      // 4. Cargar datos locales de usuarios
      await UserClass.loadCache();
    }
  });

  if (!sock.authState.creds.registered) {
    if (!PHONE_NUMBER) {
      console.error("❌ PHONE_NUMBER no está definido en .env");
      process.exit(1);
    }
    console.log("🔑 Generando código de vinculación...");
    const phoneNumber = PHONE_NUMBER.replace(/[^0-9]/g, "");
    const code = await sock.requestPairingCode(phoneNumber);
    console.log("📱 Código de vinculación:", code);
    try {
      await fs.promises.writeFile("pairing.txt", code);
    } catch (e) {
      console.warn("⚠️ No se pudo guardar el código en archivo:", e.message);
    }
  }

  sock.ev.on("messages.upsert", async (m) => {
    if (!m.messages) return;
    for (const msg of m.messages) {
      if (!msg.key.fromMe && m.type === "notify") {
        await handleMessages(sock, msg);
      }
    }
  });

  sock.ev.on("group-participants.update", async (update) => {
    await handleGroupParticipantsUpdate(update, sock);
  });

  sock.ev.on("groups.update", async (updates) => {
    await handleGroupUpdate(updates, sock);
  });
}

startDashboard(getSock);
startBot();
