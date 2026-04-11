// src/dashboard/server.js
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { join } from "path";
import fs from "fs";
import { PORT } from "../config.js";
import { redisClient } from "../database/connection.js";
import pluginLoader from "../classes/PluginLoader.js";

/**
 * Beyonder v4.3: Control Dashboard with Real-time Logs & Gravity Filters
 */
let nluActive = true; 

/**
 * Beyonder v4.4: Exporta el estado de NLU para ser usado en el intentHandler
 */
export const isNluActive = () => nluActive;

export const startDashboard = (sock) => {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer);

  const logsDir = join(process.cwd(), "logs");
  if (!fs.existsSync(logsDir)) {
    try {
      fs.mkdirSync(logsDir, { recursive: true });
    } catch (e) {
      console.warn("⚠️  [v4.3] No se pudo crear la carpeta de logs local. Se usarán solo logs de memoria.");
    }
  }

  let logStreamingActive = true;
  let onlyCriticalLogs = false; 

  // Tracker de Usuarios Online (últimos 5 min)
  const onlineUsers = new Map();

  // Interceptar logs para enviarlos al dashboard y guardarlos en archivos
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;

  const saveLogToFile = (type, msg) => {
    try {
      if (!fs.existsSync(logsDir)) return;
      const today = new Date().toISOString().split('T')[0];
      const logFile = join(logsDir, `log-${today}.txt`);
      const time = new Date().toLocaleTimeString();
      fs.appendFileSync(logFile, `[${time}] [${type.toUpperCase()}] ${msg}\n`);
    } catch (e) {
      // Ignorar fallos de escritura en disco (por si HF Space es Read-Only)
    }
  };

  const emitLog = (type, args) => {
    const msg = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
    
    // Guardado persistente (siempre activo)
    saveLogToFile(type, msg);

    // Filtrado por gravedad para streaming
    if (!logStreamingActive && type !== 'error') return;
    if (onlyCriticalLogs && type !== 'error') return;

    io.emit('log', { type, msg, time: new Date().toLocaleTimeString() });
  };

  io.on('connection', (socket) => {
    socket.emit('stream-status', { active: logStreamingActive, critical: onlyCriticalLogs, nlu: nluActive });
    
    socket.on('toggle-streaming', () => {
      logStreamingActive = !logStreamingActive;
      io.emit('stream-status', { active: logStreamingActive, critical: onlyCriticalLogs, nlu: nluActive });
      console.log(`📡 [Dashboard] Streaming de logs: ${logStreamingActive ? 'ACTIVADO' : 'PAUSADO'}`);
    });

    socket.on('toggle-critical', () => {
      onlyCriticalLogs = !onlyCriticalLogs;
      io.emit('stream-status', { active: logStreamingActive, critical: onlyCriticalLogs, nlu: nluActive });
      console.log(`🛡️ [Dashboard] Modo Crítico: ${onlyCriticalLogs ? 'ACTIVADO' : 'DESACTIVADO'}`);
    });

    socket.on('toggle-nlu', () => {
      nluActive = !nluActive;
      io.emit('stream-status', { active: logStreamingActive, critical: onlyCriticalLogs, nlu: nluActive });
      console.log(`🧠 [Dashboard] NLU/Groq: ${nluActive ? 'ACTIVADO' : 'DESACTIVADO'}`);
    });

    // Enviar lista inicial de usuarios online
    socket.emit('online-users', Array.from(onlineUsers.values()));
  });

  console.log = (...args) => {
    originalLog(...args);
    emitLog('info', args);
  };

  console.warn = (...args) => {
    originalWarn(...args);
    emitLog('warn', args);
  };

  console.error = (...args) => {
    originalError(...args);
    emitLog('error', args);
  };

  // Endpoint para registrar actividad de usuario desde messages.js
  app.use(express.json());
  app.post("/api/user-activity", (req, res) => {
    const { jid, name } = req.body;
    onlineUsers.set(jid, { jid, name, lastSeen: Date.now() });
    
    // Limpiar usuarios inactivos (+5 min)
    const now = Date.now();
    for (const [key, user] of onlineUsers) {
      if (now - user.lastSeen > 5 * 60 * 1000) onlineUsers.delete(key);
    }

    io.emit('online-users', Array.from(onlineUsers.values()));
    res.sendStatus(200);
  });

  app.get("/", (req, res) => {
    res.send(`
      <html>
        <head>
          <title>Beyonder v4 Control</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <script src="/socket.io/socket.io.js"></script>
          <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f0f0f; color: #e0e0e0; padding: 20px; margin: 0; }
              .container { max-width: 1000px; margin: auto; display: grid; grid-template-columns: 1fr 300px; gap: 20px; }
              .main-col { display: flex; flex-direction: column; gap: 20px; }
              .side-col { display: flex; flex-direction: column; gap: 20px; }
              .card { background: #1a1a1a; padding: 20px; border-radius: 12px; border: 1px solid #333; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
              .status-ok { border-left: 5px solid #00ff88; }
              .status-warn { border-left: 5px solid #ffaa00; }
              .status-error { border-left: 5px solid #ff4444; }
              .btn { border: none; padding: 10px 15px; border-radius: 6px; cursor: pointer; font-weight: bold; transition: 0.3s; margin-right: 5px; font-size: 12px; }
              .panic { background: #ff4444; color: white; width: 100%; margin-top: 10px; }
              .reload { background: #0088ff; color: white; }
              .critical-btn { background: #444; color: white; }
              .critical-active { background: #ff4444 !important; box-shadow: 0 0 10px rgba(255,68,68,0.5); }
              .stats { display: grid; grid-template-columns: 1fr; gap: 10px; font-size: 14px; }
              .log-container { background: #000; height: 400px; overflow-y: auto; padding: 15px; border-radius: 8px; font-family: 'Consolas', monospace; font-size: 12px; border: 1px solid #333; }
              .log-entry { margin-bottom: 5px; border-bottom: 1px solid #111; padding-bottom: 2px; line-height: 1.4; }
              .log-time { color: #888; margin-right: 10px; font-size: 11px; }
              .log-error { color: #ff6666; font-weight: bold; }
              .log-warn { color: #ffcc66; }
              .log-info { color: #66ffaa; }
              .user-list { list-style: none; padding: 0; margin: 0; }
              .user-item { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid #222; font-size: 13px; }
              .user-dot { width: 8px; height: 8px; background: #00ff88; border-radius: 50%; box-shadow: 0 0 5px #00ff88; }
              h1, h3 { margin: 0 0 10px 0; }
              h1 { color: #00ff88; text-shadow: 0 0 10px rgba(0,255,136,0.3); grid-column: span 2; }
              .badge { font-size: 10px; padding: 2px 6px; border-radius: 10px; background: #333; margin-left: 5px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>⚡ Beyonder v4.3 Dashboard</h1>
              
              <div class="main-col">
                <div class="card">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h3 style="margin: 0;">Terminal de Logs</h3>
                    <div style="display: flex; gap: 5px;">
                      <button id="nluBtn" class="btn reload" onclick="socket.emit('toggle-nlu')">🧠 NLU: ON</button>
                      <button id="criticalBtn" class="btn critical-btn" onclick="socket.emit('toggle-critical')">🛡️ Modo Crítico</button>
                      <button id="toggleBtn" class="btn" style="background: #333; color: white;" onclick="socket.emit('toggle-streaming')">⏸️ Pausar</button>
                    </div>
                  </div>
                  <div id="logs" class="log-container"></div>
                </div>
              </div>

              <div class="side-col">
                <div class="card status-ok">
                  <h3>Estado</h3>
                  <div class="stats">
                    <div><b>Uptime:</b> <span id="uptime">${Math.floor(process.uptime() / 60)} min</span></div>
                    <div><b>RAM:</b> ${Math.floor(process.memoryUsage().heapUsed / 1024 / 1024)} MB</div>
                    <div><b>Redis:</b> ${redisClient?.isOpen ? "✅" : "❌"}</div>
                    <div><b>WA:</b> ${sock?.ws?.readyState === 1 ? "✅" : "❌"}</div>
                  </div>
                </div>

                <div class="card">
                  <h3>Online <span id="userCount" class="badge">0</span></h3>
                  <ul id="users" class="user-list"></ul>
                </div>

                <div class="card status-warn">
                  <h3>Control</h3>
                  <button class="btn reload" style="width: 100%; margin-bottom: 5px;" onclick="fetch('/reload-plugins', {method: 'POST'})">🔄 Recargar Plugins</button>
                  <button class="btn" style="background: #444; color: white; width: 100%; margin-bottom: 5px;" onclick="if(confirm('¿Vaciar caché?')) fetch('/flush-cache', {method: 'POST'})">🧹 Limpiar Caché</button>
                  <button class="btn panic" onclick="if(confirm('¿Apagar bot?')) fetch('/panic', {method: 'POST'})">🚨 PÁNICO</button>
                </div>
              </div>
            </div>

            <script>
              const socket = io();
              const logDiv = document.getElementById('logs');
              const toggleBtn = document.getElementById('toggleBtn');
              const criticalBtn = document.getElementById('criticalBtn');
              const nluBtn = document.getElementById('nluBtn');
              const userList = document.getElementById('users');
              const userCount = document.getElementById('userCount');

              // Solicitar permiso para notificaciones
              if (Notification.permission === "default") {
                Notification.requestPermission();
              }

              function sendNotify(title, body) {
                if (Notification.permission === "granted") {
                  new Notification(title, { body, icon: "/favicon.ico" });
                }
              }
              
              socket.on('log', (data) => {
                const entry = document.createElement('div');
                entry.className = 'log-entry log-' + data.type;
                entry.innerHTML = '<span class="log-time">[' + data.time + ']</span>' + data.msg;
                logDiv.appendChild(entry);
                logDiv.scrollTop = logDiv.scrollHeight;
                
                if (data.type === 'error') {
                  sendNotify("⚠️ ERROR FATAL", data.msg);
                }

                if (logDiv.childNodes.length > 150) {
                  logDiv.removeChild(logDiv.firstChild);
                }
              });

              socket.on('stream-status', (status) => {
                // Streaming Status
                if (status.active) {
                  toggleBtn.innerHTML = '⏸️ Pausar';
                  toggleBtn.style.background = '#333';
                } else {
                  toggleBtn.innerHTML = '▶️ Reanudar';
                  toggleBtn.style.background = '#0088ff';
                }

                // Critical Mode Status
                if (status.critical) {
                  criticalBtn.classList.add('critical-active');
                  criticalBtn.innerHTML = '🛡️ Modo Crítico: ON';
                } else {
                  criticalBtn.classList.remove('critical-active');
                  criticalBtn.innerHTML = '🛡️ Modo Crítico: OFF';
                }

                // NLU Status
                if (status.nlu) {
                  nluBtn.innerHTML = '🧠 NLU: ON';
                  nluBtn.style.background = '#0088ff';
                } else {
                  nluBtn.innerHTML = '🧠 NLU: OFF';
                  nluBtn.style.background = '#444';
                }
              });

              socket.on('online-users', (users) => {
                userCount.innerHTML = users.length;
                userList.innerHTML = users.map(u => \`
                  <li class="user-item">
                    <div class="user-dot"></div>
                    <div>
                      <div style="font-weight: bold;">\${u.name}</div>
                      <div style="font-size: 10px; color: #888;">\${u.jid.split('@')[0]}</div>
                    </div>
                  </li>
                \`).join('');
              });
            </script>
        </body>
      </html>
    `);
  });

  app.post("/reload-plugins", async (req, res) => {
    console.log("🔄 [Dashboard] Recarga de plugins solicitada manualmente.");
    await pluginLoader.loadAll();
    res.sendStatus(200);
  });

  app.post("/flush-cache", async (req, res) => {
    console.log("🧹 [Dashboard] Vaciando caché de Redis...");
    try {
      if (redisClient) {
        await redisClient.flushAll();
        console.log("✅ [Dashboard] Caché vaciada con éxito.");
        res.sendStatus(200);
      } else {
        res.status(500).send("Redis no conectado");
      }
    } catch (e) {
      console.error("❌ Error al vaciar caché:", e.message);
      res.status(500).send(e.message);
    }
  });

  app.post("/panic", (req, res) => {
    console.log("🚨 [Dashboard] BOTÓN DE PÁNICO PRESIONADO.");
    process.exit(1);
  });

  httpServer.listen(PORT, () => {
    console.log(`🌐 [v4] Dashboard & Socket activo en http://localhost:${PORT}`);
  });
};
