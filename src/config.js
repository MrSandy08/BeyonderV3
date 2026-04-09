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
export const PO_TOKEN = process.env.PO_TOKEN || "";
export const VISITOR_DATA = process.env.VISITOR_DATA || "Cgs4R0QzQlFoOVo3ayijk7vOBjIKCgJETxIEGgAgTGLfAgrcAjE3LllUPXBEMGpVTkhLNjRKamlyaXRlaWdHUzFKY1FCNVlCVUwyWXl4VUpaNjVFaWFsSEVhZXRZeE5PaWk3TjJKR0RaMkNiV3V4anB1Y1NYdUcxZW90QUtEc05VeElkaTZJaFhFd0VCbXh4bjUwVFkxQWhvZ2lNLVoyQ0puZGFUTXlNdFhjTVJ0VGJmNXctbmhUa3hBcXZ2Ym5DSzVKZ1Flam1MdUJCaFprWHVBaEZSVVlWd011SWcySGppeTV3V0lUclladHJNV1RkUlNGZUFJVkEzdWdPc1Fmc0YzVGhZWEd3bWkxV2RoanBmUzRLN3EwUjlHQl9aTjU4UkxMaDlOallySzlrakM0MmN0ZG9JcjBBai1QWU9fSENaYkhILXdEeFRwYjJtT01DVzFfN0E4clNlQmc2WW5pQmNER3pkWmtkYkVRdlVnUncyZFUzZ2hHMktaRXRzYUJ5UQ==";
export const COOKIES_BROWSER = process.env.COOKIES_BROWSER || "";
// Asegurar que PHONE_NUMBER sea un string limpio o null
const rawPhone = (process.env.PHONE_NUMBER || "").trim();
export const PHONE_NUMBER = (rawPhone === "" || rawPhone === "undefined" || rawPhone === "null") ? null : rawPhone;
export const HF_TOKEN = process.env.HF_TOKEN || "";

const config = {
  MONGO_URI,
  PORT,
  PREFIX,
  OWNERS,
  YOUTUBE_COOKIES,
  PO_TOKEN,
  VISITOR_DATA,
  COOKIES_BROWSER,
  PHONE_NUMBER,
  HF_TOKEN,
};

if (!process.env.MONGO_URI && !process.env.MONGODB_URI) {
  console.warn("⚠️  MONGO_URI/MONGODB_URI no definida en .env — usando base de datos local.");
}

export default config;
