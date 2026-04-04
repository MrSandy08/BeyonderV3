import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const dropOldIndex = async () => {
  try {
    const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/test";
    await mongoose.connect(uri);
    console.log("✅ Conectado a MongoDB para mantenimiento.");
    
    const collection = mongoose.connection.collection('users');
    const indexes = await collection.indexes();
    console.log("🔍 Índices actuales:", JSON.stringify(indexes, null, 2));
    
    if (indexes.find(i => i.name === 'jid_1_groupId_1')) {
      console.log("🗑️ Eliminando índice obsoleto: jid_1_groupId_1");
      await collection.dropIndex('jid_1_groupId_1');
      console.log("✅ Índice eliminado correctamente.");
    } else {
      console.log("ℹ️ El índice jid_1_groupId_1 no existe.");
    }
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error en mantenimiento:", error.message);
    process.exit(1);
  }
};

dropOldIndex();
