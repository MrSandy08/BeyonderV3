// src/lib/config.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Asegurar que dotenv lea el .env de la raíz (sube dos niveles: lib -> src -> raíz)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/beyonder";
export const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
// Puerto para local o Render
export const PORT = parseInt(process.env.PORT) || 7860;
export const SESSION_ID = process.env.SESSION_ID || "";
export const PREFIX = process.env.PREFIX || "!";
export const COMMUNITY_ID = process.env.COMMUNITY_ID || "global";
export const OWNERS = process.env.OWNER_JID
  ? process.env.OWNER_JID.split(",").map((jid) => jid.trim())
  : [];
export const YOUTUBE_COOKIES = process.env.YOUTUBE_COOKIES || "";
export const PO_TOKEN = process.env.PO_TOKEN || "";
export const VISITOR_DATA = process.env.VISITOR_DATA || "Cgs4R0QzQlFoOVo3ayijk7vOBjIKCgJETxIEGgAgTGLfAgrcAjE3LllUPXBEMGpVTkhLNjRKamlyaXRlaWdHUzFKY1FCNVlCVUwyWXl4VUpaNjVFaWFsSEVhZXRZeE5PaWk3TjJKR0RaMkNiV3V4anB1Y1NYdUcxZW90QUtEc05VeElkaTZJaFhFd0VCbXh4bjUwVFkxQWhvZ2lNLVoyQ0puZGFUTXlNdFhjTVJ0VGJmNXctbmhUa3hBcXZ2Ym5DSzVKZ1Flam1MdUJCaFprWHVBaEZSVVlWd011SWcySGppeTV3V0lUclladHJNV1RkUlNGZUFJVkEzdWdPc1Fmc0YzVGhZWEd3bWkxV2RoanBmUzRLN3EwUjlHQl9aTjU4UkxMaDlOallySzlrakM0MmN0ZG9JcjBBai1QWU9fSENaYkhILXdEeFRwYjJtT01DVzFfN0E4clNlQmc2WW5pQmNER3pkWmtkYkVRdlVnUncyZFUzZ2hHMktaRXRzYUJ5UQ==";
export const COOKIES_BROWSER = process.env.COOKIES_BROWSER || "";

const rawPhone = (process.env.PHONE_NUMBER || "").trim();
export const PHONE_NUMBER = (rawPhone === "" || rawPhone === "undefined" || rawPhone === "null") ? null : rawPhone;

const config = {
  MONGO_URI,
  REDIS_URL,
  PORT,
  PREFIX,
  OWNERS,
  YOUTUBE_COOKIES,
  PO_TOKEN,
  VISITOR_DATA,
  COOKIES_BROWSER,
  PHONE_NUMBER,
};

export default config;
