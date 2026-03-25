// src/config.js
import "dotenv/config";

const config = {
  MONGO_URI: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/beyonder",
  PREFIX:    process.env.PREFIX    || "!",
  OWNERS:    process.env.OWNER_JID
    ? process.env.OWNER_JID.split(",").map((jid) => jid.trim())
    : [],
  YOUTUBE_COOKIES: process.env.YOUTUBE_COOKIES || "",
};

if (!process.env.MONGO_URI)  console.warn("⚠️  MONGO_URI no definida en .env — usando base de datos local.");
if (!config.OWNERS.length)   console.warn("⚠️  OWNER_JID no definida en .env — no habrá ningún owner registrado.");

export default config;
