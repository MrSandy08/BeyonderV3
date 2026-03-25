// src/store/solicitudes.js
// Map compartido entre marry.js, aceptar.js y rechazar.js
// key: `${groupJid}_${senderJid}` → { sender, targets, pendientes, rechazados, esPoliamor, expira, timer, msgId }

export const solicitudes = new Map();

// Limpieza automática cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of solicitudes) {
    if (now > val.expira) solicitudes.delete(key);
  }
}, 5 * 60 * 1000);
