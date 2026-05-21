import "dotenv/config";
import { startDashboard } from "./src/dashboard/server.js";
import config from "./src/config.js";

const { PORT } = config;

console.log("🚀 Iniciando Beyonder v4 (Modo Ultra Ligero para HF Spaces)...");
console.log(`🌐 Abriendo puerto ${PORT} (Dashboard)...`);

// Iniciar solo el Dashboard, nada más
startDashboard(() => null);

console.log("✅ Dashboard listo!");
