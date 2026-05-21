import "dotenv/config";
import { MongoClient } from "mongodb";

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/beyonder";

async function clearAuthData() {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    console.log("✅ Conectado a MongoDB!");
    const db = client.db();
    const authCollection = db.collection("auth");
    const result = await authCollection.deleteMany({});
    console.log(`✅ Eliminados ${result.deletedCount} documentos de auth!`);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

clearAuthData();
