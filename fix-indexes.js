
import mongoose from "mongoose";
import config from "./src/config.js";

const fixIndexes = async () => {
  try {
    await mongoose.connect(config.MONGO_URI);
    console.log("Conectado a MongoDB para arreglar índices...");
    
    const collection = mongoose.connection.collection("users");
    
    // Listar índices actuales
    const indexes = await collection.indexes();
    console.log("Índices actuales:", JSON.stringify(indexes, null, 2));
    
    // Intentar borrar el índice jid_1 si es único y está causando problemas
    const jidIndex = indexes.find(idx => idx.name === "jid_1");
    if (jidIndex && jidIndex.unique) {
      console.log("Borrando índice único conflictivo: jid_1...");
      await collection.dropIndex("jid_1");
      console.log("Índice jid_1 borrado exitosamente.");
    } else {
      console.log("No se encontró un índice único 'jid_1' para borrar.");
    }

    // Asegurar que el índice compuesto jid_1_groupId_1 existe y es único
    console.log("Asegurando índice compuesto { jid: 1, groupId: 1 }...");
    await collection.createIndex({ jid: 1, groupId: 1 }, { unique: true });
    console.log("Índice compuesto verificado.");

    process.exit(0);
  } catch (error) {
    console.error("Error arreglando índices:", error);
    process.exit(1);
  }
};

fixIndexes();
