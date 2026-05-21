// src/database/connection.js
import mongoose from "mongoose";
import { MONGO_URI } from "../config.js";

/**
 * Beyonder v4: Database Connection Manager (Optimizado para HF Spaces)
 * Gestiona MongoDB y la Capa de Caché con Redis.
 */
let redisClient = null;

const connectDB = async () => {
  try {
    // 1. Conectar a MongoDB (sin Redis para reducir el uso de memoria)
    if (!MONGO_URI) {
      throw new Error("MONGO_URI no está definido en el entorno.");
    }
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 60000,
      connectTimeoutMS: 15000,
      family: 4,
    });
    console.log("✅ MongoDB conectado");

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