// src/config.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Asegurar que dotenv lea el .env de la raíz, sin importar desde dónde se ejecute
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/beyonder";
export const PORT = process.env.PORT || 7860;
export const PREFIX = process.env.PREFIX || "!";
export const OWNERS = process.env.OWNER_JID
  ? process.env.OWNER_JID.split(",").map((jid) => jid.trim())
  : [];
export const YOUTUBE_COOKIES = process.env.YOUTUBE_COOKIES || "";

const config = {
  MONGO_URI,
  PORT,
  PREFIX,
  OWNERS,
  YOUTUBE_COOKIES,
};

if (!process.env.MONGO_URI && !process.env.MONGODB_URI) {
  console.warn("⚠️  MONGO_URI/MONGODB_URI no definida en .env — usando base de datos local.");
}

export default config;
