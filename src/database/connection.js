// src/database/connection.js
import mongoose from "mongoose";
import { createClient } from "redis";
import { MONGO_URI, REDIS_URL } from "../config.js";

/**
 * Beyonder v4: Database Connection Manager
 * Gestiona MongoDB y la Capa de Caché con Redis.
 */
let redisClient = null;

const connectDB = async () => {
  try {
    // 1. Conectar a MongoDB
    if (!MONGO_URI) {
      throw new Error("MONGO_URI no está definido en el entorno.");
    }
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      family: 4,
    });
    console.log("✅ MongoDB conectado");

    // 2. Conectar a Redis (Caché)
    try {
      redisClient = createClient({
        url: REDIS_URL || "redis://localhost:6379"
      });

      redisClient.on("error", (err) => console.error("❌ Redis Error:", err));
      redisClient.on("connect", () => console.log("✅ Redis conectado"));

      await redisClient.connect();
    } catch (redisErr) {
      console.warn("⚠️  Redis no disponible. El bot funcionará sin caché (más lento).", redisErr.message);
      redisClient = null;
    }
  } catch (error) {
    console.error("❌ Error al conectar con las bases de datos:", error.message);
    process.exit(1);
  }
};

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️  MongoDB desconectado.");
});

mongoose.connection.on("reconnected", () => {
  console.log("🔄 MongoDB reconectado.");
});

export { redisClient };
export default connectDB;