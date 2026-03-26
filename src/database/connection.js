// src/database/connection.js
import mongoose from "mongoose";
import { MONGO_URI } from "../config.js";

const connectDB = async () => {
  try {
    if (!MONGO_URI) {
      throw new Error("MONGO_URI no está definido en el entorno.");
    }
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // falla rápido si Mongo no responde
    });
    console.log("✅ MongoDB conectado");
  } catch (error) {
    console.error("❌ Error al conectar con MongoDB:", error.message);
    process.exit(1); // detiene el bot si no hay base de datos
  }
};

// Eventos de ciclo de vida — útiles para saber qué pasa después del arranque
mongoose.connection.on("disconnected", () => {
  console.warn("⚠️  MongoDB desconectado.");
});

mongoose.connection.on("reconnected", () => {
  console.log("🔄 MongoDB reconectado.");
});

export default connectDB;