This file is a merged representation of the entire codebase, combined into a single document by Repomix.
The content has been processed where content has been compressed (code blocks are separated by ⋮---- delimiter).

# File Summary

## Purpose
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Content has been compressed - code blocks are separated by ⋮---- delimiter
- Files are sorted by Git change count (files with more changes are at the bottom)

# Directory Structure
```
.gitattributes
.gitignore
Dockerfile
fix-indexes.js
index.js
main.py
package.json
README.md
requirements.txt
scripts_python/detector.py
scripts_python/requirements.txt
src/comandos/economia/atracar.js
src/comandos/economia/cazar.js
src/comandos/economia/claim.js
src/comandos/economia/crimen.js
src/comandos/economia/cultivar.js
src/comandos/economia/daily.js
src/comandos/economia/depositar.js
src/comandos/economia/extorsionar.js
src/comandos/economia/fianza.js
src/comandos/economia/impuesto.js
src/comandos/economia/minar.js
src/comandos/economia/pescar.js
src/comandos/economia/retirar.js
src/comandos/economia/ricos.js
src/comandos/economia/robar.js
src/comandos/economia/slut.js
src/comandos/economia/suerte.js
src/comandos/economia/work.js
src/comandos/fun/play.js
src/comandos/fun/ship.js
src/comandos/fun/sticker.js
src/comandos/general/aceptar.js
src/comandos/general/adoptar.js
src/comandos/general/desadoptar.js
src/comandos/general/divorcio.js
src/comandos/general/excusa.js
src/comandos/general/ia.js
src/comandos/general/info.js
src/comandos/general/lover.js
src/comandos/general/marry.js
src/comandos/general/menu.js
src/comandos/general/rechazar.js
src/comandos/general/relaciones.js
src/comandos/general/reporte.js
src/comandos/general/sugerencia.js
src/comandos/general/top10.js
src/comandos/general/ver.js
src/comandos/mod/adv.js
src/comandos/mod/antifiltro.js
src/comandos/mod/antiflood.js
src/comandos/mod/antilink.js
src/comandos/mod/antiporn.js
src/comandos/mod/ban.js
src/comandos/mod/cerrar.js
src/comandos/mod/economy.js
src/comandos/mod/kick.js
src/comandos/mod/nota.js
src/comandos/mod/ping.js
src/comandos/mod/promover.js
src/comandos/mod/quitar.js
src/comandos/mod/reset.js
src/comandos/owner/addowner.js
src/comandos/owner/beyonder.js
src/comandos/owner/claim.js
src/comandos/owner/community.js
src/comandos/owner/desmod.js
src/comandos/owner/lock.js
src/comandos/owner/mod.js
src/comandos/owner/nuke.js
src/comandos/owner/ownerping.js
src/comandos/owner/owners.js
src/comandos/owner/removeowner.js
src/comandos/owner/set.js
src/comandos/owner/test.js
src/comandos/rp/rp.js
src/config.js
src/database/connection.js
src/database/models/Affinity.js
src/database/models/BanList.js
src/database/models/BeyonderCore.js
src/database/models/Buscados.js
src/database/models/CommunityState.js
src/database/models/Config.js
src/database/models/Group.js
src/database/models/GroupSlang.js
src/database/models/Suggestion.js
src/database/models/User.js
src/events/connection.js
src/events/groupUpdate.js
src/events/messages.js
src/handlers/commandHandler.js
src/middlewares/permissions.js
src/services/aiService.js
src/services/downloadService.js
src/services/iaService.js
src/services/initiativeService.js
src/services/reaccionesService.js
src/services/uploadService.js
src/store/searches.js
src/store/solicitudes.js
src/utils/detector.js
src/utils/fakeQuote.js
src/utils/format.js
src/utils/kinship.js
src/utils/mediaWorker.js
src/utils/mongoAuthState.js
src/utils/socialFilter.js
src/utils/userTarget.js
youtube_cookies.json
```

# Files

## File: .gitattributes
```
assets/*.png filter=lfs diff=lfs merge=lfs -text
```

## File: fix-indexes.js
```javascript
const fixIndexes = async () =>
⋮----
// Listar índices actuales
⋮----
// Intentar borrar el índice jid_1 si es único y está causando problemas
⋮----
// Asegurar que el índice compuesto jid_1_groupId_1 existe y es único
```

## File: scripts_python/detector.py
```python
app = FastAPI()
⋮----
# Configurar dispositivo a CPU
device = "cpu"
⋮----
# Cargar NudeNet (Detector de objetos)
detector = NudeDetector()
⋮----
# Cargar CLIP oficial de OpenAI
⋮----
@app.post("/analyze")
async def analyze(file: UploadFile = File(...))
⋮----
# 1. Leer contenido
contents = await file.read()
⋮----
# 2. VALIDACIÓN CRÍTICA: Si el bot mandó 0 bytes, frenar aquí
⋮----
# 3. Probar si Pillow puede abrirlo antes de pasarlo a NudeNet
image = Image.open(io.BytesIO(contents)).convert("RGB")
# verify() no funciona después de convert() o transformaciones,
# pero el hecho de abrirlo y convertirlo ya es una validación.
⋮----
# 1. NudeNet (NSFW)
# NudeNet 3.x requiere un path de archivo para .detect()
# Para evitar problemas de concurrencia y lentitud, guardamos un temporal muy breve
temp_path = f"temp_{os.getpid()}_{torch.randint(0, 1000000, (1,)).item()}.jpg"
⋮----
nude_results = detector.detect(temp_path)
⋮----
is_nsfw_score = 1.0 if len(nude_results) > 0 else 0.0
⋮----
# 2. CLIP (Gore, Anime, Porn, Hentai, Sexting)
image_input = preprocess(image).unsqueeze(0).to(device)
labels = [
text = clip.tokenize(labels).to(device)
⋮----
probs = logits_per_image.softmax(dim=-1).cpu().numpy()[0]
```

## File: scripts_python/requirements.txt
```
nudenet
opencv-python-headless
torch
transformers
Pillow
```

## File: src/comandos/economia/impuesto.js
```javascript
// src/comandos/mod/impuesto.js
⋮----
export const run = async (contexto) =>
⋮----
// Cobrar de la CARTERA a todos los usuarios que tengan dinero
⋮----
// Asegurar que nadie quede en negativo (cartera)
```

## File: src/comandos/fun/play.js
```javascript
export const run = async (contexto) =>
⋮----
// Almacenar resultados para la selección interactiva
⋮----
// Limpiar búsqueda anterior si existe
⋮----
}, 60000); // 1 minuto de expiración
```

## File: src/comandos/general/ia.js
```javascript
// src/comandos/general/ia.js
⋮----
export const run = async (contexto) =>
⋮----
// Forzamos la respuesta (100% probabilidad)
⋮----
// Guardar en historial
⋮----
// Enviamos la respuesta citando el mensaje
```

## File: src/comandos/general/sugerencia.js
```javascript
// src/comandos/general/sugerencia.js
⋮----
export const run = async (contexto) =>
⋮----
// Guardar en DB
⋮----
// Enviar al grupo secundario
```

## File: src/comandos/general/top10.js
```javascript
// src/comandos/general/top10.js
⋮----
const numFromJid = (jid)
⋮----
export const run = async (contexto) =>
```

## File: src/comandos/mod/antiflood.js
```javascript
// src/comandos/mod/antiflood.js
⋮----
export const run = async (contexto) =>
```

## File: src/comandos/mod/antilink.js
```javascript
// src/comandos/mod/antilink.js
⋮----
export const run = async (contexto) =>
```

## File: src/comandos/mod/antiporn.js
```javascript
// src/comandos/mod/antinsfw.js
⋮----
export const run = async (contexto) =>
```

## File: src/comandos/mod/ban.js
```javascript
// src/comandos/mod/ban.js
// !ban @user [motivo] | !unban #N | !lista ban
⋮----
const numFromJid = (jid)
⋮----
export const run = async (contexto) =>
⋮----
// ── !lista ban ─────────────────────────────────────────────────────────────
⋮----
// ── !unban #N ──────────────────────────────────────────────────────────────
⋮----
// ── !ban @user [motivo] ────────────────────────────────────────────────────
⋮----
// Expulsar si está en el grupo
```

## File: src/comandos/mod/cerrar.js
```javascript
// src/comandos/mod/cerrar.js
⋮----
export const run = async (contexto) =>
```

## File: src/comandos/mod/economy.js
```javascript
// src/comandos/mod/economy.js
⋮----
export const run = async (contexto) =>
```

## File: src/comandos/mod/ping.js
```javascript
// src/comandos/general/ping.js
⋮----
export const run = async (contexto) =>
```

## File: src/comandos/owner/beyonder.js
```javascript
// src/comandos/owner/beyonder.js
⋮----
export const run = async (contexto) =>
```

## File: src/comandos/owner/community.js
```javascript
// src/comandos/owner/community.js
⋮----
export const run = async (contexto) =>
⋮----
const current = contexto.communityId; // Usamos el ID ya detectado en el contexto
```

## File: src/comandos/owner/lock.js
```javascript
// src/comandos/owner/lock.js
⋮----
export const run = async (contexto) =>
```

## File: src/comandos/owner/nuke.js
```javascript
// src/comandos/owner/nuke.js
⋮----
export const run = async (contexto) =>
```

## File: src/comandos/owner/owners.js
```javascript
// src/comandos/owner/owners.js
⋮----
const numFromJid = (jid)
⋮----
export const run = async (contexto) =>
⋮----
// Los owners son globales, pero buscamos por el JID único
```

## File: src/comandos/owner/set.js
```javascript
// src/comandos/owner/set.js
⋮----
export const run = async (contexto) =>
```

## File: src/database/models/BanList.js
```javascript
// src/database/models/BanList.js
```

## File: src/database/models/BeyonderCore.js
```javascript
// src/database/models/BeyonderCore.js
⋮----
likes: [{ type: String }], // Ej: ["lluvia", "gatos", "programación"]
dislikes: [{ type: String }], // Ej: ["reggaetón", "calor", "admins pesados"]
values: [{ type: String }], // Ej: ["lealtad", "sarcasmo", "eficiencia"]
⋮----
patience: { type: Number, default: 100 }, // 0 a 100
fatigue: { type: Number, default: 0 }, // 0 a 100
```

## File: src/database/models/Buscados.js
```javascript
// src/database/models/Buscados.js
```

## File: src/database/models/CommunityState.js
```javascript
// src/database/models/CommunityState.js
⋮----
mood: { type: String, default: "Neutral" }, // Triste, Eufórico, Enojado, Neutral
tension: { type: Number, default: 0 }, // 0 a 100
⋮----
type: { type: String }, // kick, join, fight, silence
```

## File: src/database/models/Group.js
```javascript

```

## File: src/database/models/GroupSlang.js
```javascript
// src/database/models/GroupSlang.js
⋮----
// Índice único por comunidad y palabra
```

## File: src/database/models/Suggestion.js
```javascript
// src/database/models/Suggestion.js
```

## File: src/events/connection.js
```javascript

```

## File: src/events/groupUpdate.js
```javascript
// src/events/groupUpdate.js
⋮----
/**
 * Maneja las actualizaciones de participantes en grupos (joins, kicks, leaves)
 */
export const handleGroupParticipantsUpdate = async (update, sock) =>
⋮----
// 1. Obtener communityId
⋮----
// Actualizar estado de la comunidad
⋮----
// ── REACCIÓN ORGÁNICA DE BEYONDER ──
// Solo reacciona si el evento es importante (afinidad alta/baja o expulsión)
⋮----
true // Forzar respuesta
⋮----
/**
 * Maneja las actualizaciones de metadatos del grupo (nombre, descripción, etc.)
 */
export const handleGroupUpdate = async (updates, sock) =>
⋮----
// Reacción opcional
```

## File: src/middlewares/permissions.js
```javascript
// src/middlewares/permissions.js
⋮----
/**
 * Verifica si un usuario tiene el nivel de permisos requerido.
 *
 * Niveles:
 *   0 → User   (todos)
 *   1 → Helper
 *   2 → Admin
 *   3 → Owner  (global)
 *
 * @param {string} jid      - JID de WhatsApp del usuario
 * @param {number} nivel    - Nivel mínimo requerido (0–3)
 * @param {string} groupId  - JID del grupo para permisos locales (Mod/Helper)
 * @returns {Promise<boolean>}
 */
const checkPermiso = async (jid, nivel = 0, groupId = "global") =>
⋮----
// ── Prioridad absoluta: Owner por config ───────────────────────────────────
⋮----
// ── Nivel 0: cualquiera puede ─────────────────────────────────────────────
⋮----
// ── Buscar si es Owner global en MongoDB ──────────────────────────────────
⋮----
if (nivel === 3) return false; // Si llegamos aquí y nivel es 3, no es owner
⋮----
// ── Buscar permisos locales (Mod/Helper) ────────────────────────────────
```

## File: src/services/aiService.js
```javascript

```

## File: src/services/downloadService.js
```javascript
/**
 * SERVICIO DE DESCARGAS MULTIMEDIA (Cobalt API)
 * Soporta YouTube, TikTok, Instagram y más.
 */
⋮----
/**
 * Descarga multimedia usando la API de Cobalt.
 * @param {string} url - URL del video/audio.
 * @param {string} mode - 'audio' o 'video'.
 * @returns {Promise<{success: boolean, buffer?: Buffer, filename?: string, error?: string}>}
 */
export const downloadCobalt = async (url, mode = "audio") =>
⋮----
// 1. Petición a la API de Cobalt
⋮----
// 2. Descargar el archivo directamente a memoria (buffer)
⋮----
/**
 * Detecta si una URL es compatible con Cobalt (YouTube, TikTok, Instagram, etc.)
 * @param {string} url 
 * @returns {boolean}
 */
export const isCobaltUrl = (url) =>
```

## File: src/services/initiativeService.js
```javascript
// src/services/initiativeService.js
⋮----
/**
 * Revisa grupos inactivos e inicia conversación si es necesario
 */
export const checkGroupInactivity = async (sock) =>
⋮----
// Buscar comunidades inactivas hace más de 5 horas
⋮----
// Solo hay un 20% de probabilidad de que inicie charla para no ser molesto
⋮----
// Obtener un grupo de esa comunidad (podemos guardarlos en Config o buscarlos en metaCache)
// Para simplificar, si el communityId es un jid de grupo, lo usamos directamente
⋮----
// Actualizar actividad para no repetir inmediatamente
```

## File: src/services/reaccionesService.js
```javascript
// src/services/reaccionesService.js
⋮----
/**
 * Envía una reacción visual (GIF/Sticker) desde Neko.best API.
 */
export async function enviarReaccionNeko(sock, from, type, msg = null, mentions = [])
```

## File: src/services/uploadService.js
```javascript

```

## File: src/store/searches.js
```javascript
// src/store/searches.js
// Almacena temporalmente los resultados de búsqueda interactiva (como !play)
⋮----
// Formato de la llave: groupId + senderId
// Formato del valor: { results: Array, type: "audio"|"video", timer: Number }
```

## File: src/store/solicitudes.js
```javascript
// src/store/solicitudes.js
// Map compartido entre marry.js, aceptar.js y rechazar.js
// key: `${groupJid}_${senderJid}` → { sender, targets, pendientes, rechazados, esPoliamor, expira, timer, msgId }
⋮----
// Limpieza automática cada 5 minutos
```

## File: src/utils/fakeQuote.js
```javascript
/**
 * Crea una estructura de mensaje falso para citar (Quoted Message)
 * Útil para simular que un usuario dijo algo que no dijo o que borró.
 * 
 * @param {string} sender - JID del usuario que supuestamente envió el mensaje
 * @param {string} text - Contenido del mensaje falso
 * @param {string} id - ID opcional del mensaje (por defecto uno aleatorio)
 * @returns {Object} - Estructura de mensaje para usar en options.quoted
 */
export const createFakeQuoted = (sender, text, id = null) =>
⋮----
remoteJid: "0@s.whatsapp.net", // No importa mucho para el quote visual
⋮----
/**
 * Ejemplo de uso en un comando:
 * 
 * import { createFakeQuoted } from "../../utils/fakeQuote.js";
 * 
 * const fake = createFakeQuoted(targetJid, "¡No, yo no dije eso!");
 * await sock.sendMessage(from, { text: "¡Claro que sí lo dijiste!" }, { quoted: fake });
 */
```

## File: src/utils/socialFilter.js
```javascript
// src/utils/socialFilter.js
⋮----
/**
 * Determina si Beyonder debería responder de forma orgánica a un mensaje/media.
 * @returns {Promise<boolean>}
 */
export async function shouldRespondOrganically(contexto)
⋮----
// 1. Siempre responde a menciones directas o replies
⋮----
// 2. Obtener estado de Beyonder y Afinidad
⋮----
// 3. Lógica de "Ganas de hablar" (Energía Social)
// Si tiene poca paciencia, solo habla con sus mejores amigos o si es muy importante
⋮----
if (afinidad > 90) return true; // Con mejores amigos hace el esfuerzo
if (isMorboso && paciencia > 5) return true; // El morbo le da un pico de energía
⋮----
// 4. Lógica de "Interés en el Contenido" (Saliencia)
⋮----
// El morbo es muy interesante para Beyonder
⋮----
// Gustos personales (basados en tags de CLIP)
⋮----
// Longitud y esfuerzo del mensaje (un "hola" no interesa, una anécdota sí)
⋮----
// 5. Lógica de "Contexto Social" (Tensión)
// Si hay una pelea (tensión alta), Beyonder se mete a opinar
⋮----
// 6. Decisión Final basada en Interés vs Afinidad
// A mayor afinidad, menos interés requiere para responder
```

## File: youtube_cookies.json
```json
[ 
   { "domain": ".youtube.com", "name": "VISITOR_INFO1_LIVE", "value": "8GD3BQh9Z7k" }, 
   { "domain": ".youtube.com", "name": "GPS", "value": "1" }, 
   { "domain": ".youtube.com", "name": "YSC", "value": "_p-DU4LHu-4" }, 
   { "domain": ".youtube.com", "name": "SOCS", "value": "CAI" }, 
   { "domain": ".youtube.com", "name": "__Secure-YNID", "value": "17.YT=pD0jUNHK64JjiriteigGS1JcQB5YBUL2YyxUJZ65EialHEaetYxNOii7N2JGDZ2CbWuxjpucSXuG1eotAKDsNUxIdi6IhXEwEBmxxn50TY1AhogiM-Z2CJndaTMyMtXcMRtTbf5w-nhTkxAqvvbnCK5JgQejmLuBBhZkXuAhFRUYVwMuIg2Hjiy5wWITrYZtrMWTdRSFeAIVA3ugOsQfsF3ThYXGwmi1WdhjpfS4K7q0R9GB_ZN58RLLh9NjYrK9kjC42ctdoIr0Aj-PYO_HCZbHH-wDxTpb2mOMCW1_7AEME9M9cSy9FvfHvcx2gMPkp1H5Dj4YaKufPRsAyon8Tf" } 
 ]
```

## File: .gitignore
```
node_modules
auth_info_baileys
.env
.venv
tmp/
auth_info
```

## File: README.md
```markdown
---
title: Beyond Squad
emoji: ⚡
colorFrom: blue
colorTo: purple
sdk: docker
pinned: false
---

# Beyond Squad API
Esta es la API para el bot de WhatsApp.
```

## File: src/comandos/economia/cazar.js
```javascript
// src/comandos/economia/cazar.js
⋮----
export const run = async (contexto) =>
⋮----
if (suerte < 0.10) { // 10% Legendario
⋮----
} else if (suerte < 0.25) { // 15% Raro
⋮----
} else if (suerte < 0.55) { // 30% Común
⋮----
} else if (suerte < 0.85) { // 30% Poco valor
⋮----
} else { // 15% Daño/Ataque
⋮----
user.cooldowns.cazar = new Date(ahora.getTime() + 5 * MS_EN_MIN); // 5 min cooldown por daño
⋮----
user.cooldowns.cazar = new Date(ahora.getTime() + 3 * MS_EN_MIN); // 3 min cooldown
```

## File: src/comandos/economia/claim.js
```javascript
// src/comandos/economia/claim.js
⋮----
// Almacenamos el regalo activo en RAM
⋮----
export const run = async (contexto) =>
⋮----
// Solo el Owner puede lanzar un regalo manualmente
⋮----
// Si alguien intenta reclamar
⋮----
activeGift = null; // Se consume el regalo
⋮----
// Función para lanzar regalos aleatorios (opcional, se puede llamar desde index.js)
export const spawnRandomGift = (sock, from) =>
```

## File: src/comandos/economia/crimen.js
```javascript
// src/comandos/economia/crimen.js
⋮----
export const run = async (contexto) =>
⋮----
const exito = suerte < 0.70; // 70% éxito
⋮----
user.cooldowns.crimen = new Date(ahora.getTime() + 3 * MS_EN_MIN); // 3 min cooldown
⋮----
// Fallo: Cárcel por 15 min y multa
⋮----
user.jailUntil = new Date(ahora.getTime() + 15 * MS_EN_MIN); // 15 min cárcel
```

## File: src/comandos/economia/cultivar.js
```javascript
// src/comandos/economia/cultivar.js
⋮----
export const run = async (contexto) =>
⋮----
// Si usa !cosechar
⋮----
// Si pasaron más de 10 min de la cosecha, se marchita
⋮----
// Si usa !cultivar
```

## File: src/comandos/economia/depositar.js
```javascript
// src/comandos/economia/depositar.js
⋮----
export const run = async (contexto) =>
```

## File: src/comandos/economia/extorsionar.js
```javascript
// src/comandos/economia/extorsionar.js
⋮----
const numFromJid = (jid)
⋮----
export const run = async (contexto) =>
⋮----
const exito = suerte < 0.65; // 65% éxito
⋮----
// Fallo: Cárcel por 15 min y multa
⋮----
user.jailUntil = new Date(ahora.getTime() + 15 * MS_EN_MIN); // 15 min cárcel
```

## File: src/comandos/economia/fianza.js
```javascript
// src/comandos/economia/fianza.js
⋮----
export const run = async (contexto) =>
⋮----
// La fianza es el 10% del dinero total (cartera + banco) con un mínimo de 1000
⋮----
// Cobrar de la cartera primero, luego del banco
```

## File: src/comandos/economia/minar.js
```javascript
// src/comandos/economia/minar.js
⋮----
export const run = async (contexto) =>
⋮----
if (suerte < 0.05) { // 5% Legendario
⋮----
} else if (suerte < 0.20) { // 15% Raro
⋮----
} else if (suerte < 0.50) { // 30% Común
⋮----
} else { // 50% Poco valor
⋮----
user.cooldowns.minar = new Date(ahora.getTime() + 3 * MS_EN_MIN); // 3 min cooldown
```

## File: src/comandos/economia/pescar.js
```javascript
// src/comandos/economia/pescar.js
⋮----
export const run = async (contexto) =>
⋮----
if (suerte < 0.05) { // 5% Legendario
⋮----
} else if (suerte < 0.15) { // 10% Raro
⋮----
} else if (suerte < 0.45) { // 30% Común
⋮----
} else if (suerte < 0.70) { // 25% Poco valor
⋮----
} else { // 30% Pérdida
⋮----
user.cooldowns.pescar = new Date(ahora.getTime() + 2 * MS_EN_MIN); // 2 min cooldown
```

## File: src/comandos/economia/retirar.js
```javascript
// src/comandos/economia/retirar.js
⋮----
export const run = async (contexto) =>
```

## File: src/comandos/economia/robar.js
```javascript
// src/comandos/economia/robar.js
⋮----
const numFromJid = (jid)
⋮----
export const run = async (contexto) =>
⋮----
const exito = suerte < 0.60; // 60% éxito
⋮----
// Roba entre el 1% y el 5% de la cartera
⋮----
// Fallo: Sin cárcel, solo cooldown y pequeña pérdida
```

## File: src/comandos/economia/suerte.js
```javascript
// src/comandos/economia/suerte.js
⋮----
export const run = async (contexto) =>
⋮----
const exito = suerte < 0.48; // 48% éxito (casi 50/50 como un casino real)
⋮----
const ganancia = Math.floor(apuesta * 1.5); // Gana 1.5 veces su apuesta
⋮----
user.cooldowns.suerte = new Date(ahora.getTime() + 1 * MS_EN_MIN); // 1 min cooldown
⋮----
user.cooldowns.suerte = new Date(ahora.getTime() + 1 * MS_EN_MIN); // 1 min cooldown
```

## File: src/comandos/fun/ship.js
```javascript
// Configurar ffmpeg
⋮----
async function gifToMp4(buffer)
⋮----
// Timeout de 10 segundos para la conversión
⋮----
export const run = async (contexto) =>
⋮----
// Detectar objetivos
⋮----
// Si hay menciones, usarlas
⋮----
// Si no hay menciones, usar userTarget para el segundo objetivo
⋮----
// Generar porcentaje consistente por día para la misma pareja
⋮----
// Obtener nombres
⋮----
// Obtener GIF de nekos.best (o Giphy/Tenor si fuera posible, pero nekos.best es más directo)
```

## File: src/comandos/general/adoptar.js
```javascript
// src/comandos/general/adoptar.js
⋮----
const numFromJid   = (jid)
const primerNombre = (n)
⋮----
export const run = async (contexto) =>
⋮----
// Detectar objetivo: mención o personaje
⋮----
// ── VALIDACIONES DE PARENTESCO ─────────────────────────────────────────────
⋮----
// 1. Matrimonio: Si ya están casados, no pueden adoptarse.
⋮----
// 2. Ya tiene padre/madre: Si el objetivo ya tiene un padre/madre, no puede ser adoptado por otro (o ya es tuyo).
⋮----
// 3. Circularidad: El objetivo no puede ser tu ancestro (padre, abuelo...).
⋮----
// 4. Hermanos: No pueden adoptarse entre sí.
⋮----
// ── SOLICITUD DE ADOPCIÓN ──────────────────────────────────────────────────
⋮----
type: "adopt", // <--- IMPORTANTE: Distinguir de 'marry'
```

## File: src/comandos/general/desadoptar.js
```javascript
// src/comandos/general/desadoptar.js
⋮----
const numFromJid   = (jid)
const primerNombre = (n)
⋮----
export const run = async (contexto) =>
⋮----
// Detectar objetivo: mención o personaje
⋮----
// Actualizar ambos globalmente
```

## File: src/comandos/general/divorcio.js
```javascript
// src/comandos/general/divorcio.js
⋮----
const numFromJid   = (jid)
const primerNombre = (n)
⋮----
export const run = async (contexto) =>
```

## File: src/comandos/general/excusa.js
```javascript
// src/comandos/general/excusa.js
// !excusa [motivo] [Nd] | !excusa off | !verexcusa @tag | !verexcusas
⋮----
const numFromJid = (jid)
⋮----
export const run = async (contexto) =>
⋮----
// ── !verexcusas — solo admins ─────────────────────────────────────────────
⋮----
// ── !verexcusa @tag ───────────────────────────────────────────────────────
⋮----
// ── !excusa off ───────────────────────────────────────────────────────────
⋮----
// ── !excusa [motivo] [Nd] — cualquiera puede ponerse su propia excusa ─────
const objetivo = sender; // Por defecto siempre es el propio usuario para evitar abusos
```

## File: src/comandos/general/lover.js
```javascript
// src/comandos/general/lover.js
⋮----
const numFromJid   = (jid)
const primerNombre = (n)
⋮----
export const run = async (contexto) =>
```

## File: src/comandos/general/rechazar.js
```javascript
// src/comandos/general/rechazar.js
⋮----
const numFromJid   = (jid)
const primerNombre = (n)
⋮----
export const run = async (contexto) =>
```

## File: src/comandos/general/reporte.js
```javascript
// src/comandos/general/reporte.js
⋮----
export const run = async (contexto) =>
⋮----
// Obtener admins del grupo
```

## File: src/comandos/general/ver.js
```javascript
export const run = async (contexto) =>
⋮----
// Clonamos el contexto para no afectar el original y quitamos el subcomando de args
```

## File: src/comandos/mod/adv.js
```javascript
// src/comandos/mod/adv.js
// !adv @user [motivo] | !ver adv [@user]
⋮----
const numFromJid = (jid)
⋮----
export const run = async (contexto) =>
⋮----
// ── !veradv [@user] — cualquiera puede ver ────────────────────────────────
⋮----
// ── !adv — solo admins WA / Mods / Owners ─────────────────────────────────
⋮----
// Extraer el motivo
⋮----
// ── Auto-kick a 3/3 ───────────────────────────────────────────────────────
```

## File: src/comandos/mod/antifiltro.js
```javascript
// src/comandos/mod/antifiltro.js
⋮----
export const run = async (contexto) =>
⋮----
// Verificar si está bloqueado por Owner
⋮----
// Si usa !antifiltro on/off directamente, activamos ambos por defecto o pedimos especificar
```

## File: src/comandos/mod/kick.js
```javascript
// src/comandos/mod/kick.js
⋮----
const numFromJid = (jid)
⋮----
export const run = async (contexto) =>
```

## File: src/comandos/mod/nota.js
```javascript
// src/comandos/mod/nota.js
// !nota @user texto | !historial @user | !quitar nota #N @user
⋮----
const numFromJid = (jid)
const timeAgo    = (f)   =>
⋮----
export const run = async (contexto) =>
⋮----
// ── !historial @user ───────────────────────────────────────────────────────
⋮----
// ── !nota @user texto ──────────────────────────────────────────────────────
```

## File: src/comandos/mod/reset.js
```javascript
// src/comandos/mod/reset.js
⋮----
export const run = async (contexto) =>
⋮----
// Obtener objetivo (ignorando el primer argumento que es el tipo)
```

## File: src/comandos/owner/addowner.js
```javascript
// src/comandos/owner/addowner.js
⋮----
const numFromJid = (jid)
⋮----
export const run = async (contexto) =>
⋮----
// Verificar si ya es Owner
⋮----
// Verificar límite máximo
⋮----
// Registrar como Owner globalmente
```

## File: src/comandos/owner/desmod.js
```javascript
// src/comandos/owner/desmod.js
⋮----
const numFromJid = (jid)
⋮----
export const run = async (contexto) =>
⋮----
// Verificar si es Owner global
⋮----
// Quitar permisos globalmente
⋮----
// Quitar admin en WhatsApp
```

## File: src/comandos/owner/ownerping.js
```javascript
// src/comandos/owner/ownerping.js
⋮----
export const run = async (contexto) =>
```

## File: src/database/models/Affinity.js
```javascript
// src/database/models/Affinity.js
⋮----
points: { type: Number, default: 0 }, // -100 a 100
status: { type: String, default: "Desconocido" }, // Mejor amigo, Enemigo, Desconocido, etc.
⋮----
// Índice para buscar afinidad por usuario en una comunidad específica
```

## File: src/utils/kinship.js
```javascript
/**
 * Verifica si un usuario es ancestro de otro (circularidad).
 * @param {string} ancestorJid - El posible ancestro.
 * @param {string} userJid - El usuario a revisar.
 * @param {string} communityId - ID de la comunidad.
 * @returns {Promise<boolean>}
 */
export async function isAncestor(ancestorJid, userJid, communityId)
⋮----
/**
 * Verifica si dos usuarios son hermanos (mismo padre/madre).
 * @param {string} user1Jid
 * @param {string} user2Jid
 * @param {string} communityId
 * @returns {Promise<boolean>}
 */
export async function areSiblings(user1Jid, user2Jid, communityId)
```

## File: src/utils/mediaWorker.js
```javascript
// Los workers no comparten el scope de importaciones normales de la misma forma si no se configuran,
// pero aquí usaremos importaciones directas.
⋮----
'FEMALE_GENITALIA_EXPOSED': 0.85, // Umbral elevado a 0.85 para mayor precisión
⋮----
'FEMALE_BREAST_EXPOSED':    0.90, // Pechos expuestos necesitan más confianza
⋮----
const HF_TOKEN = process.env.HF_TOKEN; // Opcional, por si el Space es privado
⋮----
async function processMedia()
⋮----
// 1. Pre-procesamiento con Sharp (Bajar saturación 10% para NudeNet)
⋮----
// 2. Prioridad: NudeNet (NSFW) primero
⋮----
if (det.score >= 0.65) { // Umbral de duda mínimo
⋮----
// No hacemos break para encontrar el maxScore real
⋮----
// 3. Validación Semántica Cruzada con CLIP
⋮----
// LÓGICA DE CAPAS (NSFW)
⋮----
// Ajuste de umbral por Artwork/Dibujo
⋮----
// CAPA DE DUDA (70% - 85%)
⋮----
// LÓGICA GORE (Si no hubo NSFW)
```

## File: src/utils/mongoAuthState.js
```javascript
/**
 * Implementación manual de persistencia de estado de Baileys en MongoDB.
 * Soluciona el error de tipos de datos (Object vs Buffer) al serializar/deserializar.
 * 
 * @param {import('mongodb').Collection} collection - Colección de MongoDB para guardar el estado.
 */
export const useMongoDBAuthState = async (collection) =>
⋮----
/**
   * Escribe datos en la colección, convirtiendo Buffers a formato JSON seguro.
   */
const writeData = async (data, id) =>
⋮----
/**
   * Lee datos de la colección y revive los Buffers correctamente.
   */
const readData = async (id) =>
⋮----
/**
   * Elimina datos de la colección.
   */
const removeData = async (id) =>
⋮----
// 1. Cargar o inicializar credenciales
⋮----
get: async (type, ids) =>
set: async (data) =>
⋮----
saveCreds: async () =>
```

## File: src/comandos/economia/atracar.js
```javascript
// src/comandos/economia/atracar.js
⋮----
const numFromJid = (jid)
⋮----
export const run = async (contexto) =>
⋮----
// 45% éxito normal (cartera), 15% éxito crítico (banco)
⋮----
// Asalto Bancario: 5-10% del banco
⋮----
// Atraco normal: 10-20% de la cartera
⋮----
// Si no tiene nada en cartera pero sí en banco, el robo falla o es mínimo
⋮----
// Fallo: Cárcel por 1 hora y multa
⋮----
user.jailUntil = new Date(ahora.getTime() + 60 * MS_EN_MIN); // 1 hora cárcel
```

## File: src/comandos/fun/sticker.js
```javascript
// src/comandos/fun/sticker.js
⋮----
export const run = async (
⋮----
// Verificar si es video y no dura más de 10 segundos
⋮----
// Descarga Segura: Reintento si el buffer es pequeño
⋮----
// Si es respuesta (quoted), descargar el mensaje citado correctamente
⋮----
// ── Check de Seguridad ──
⋮----
// Identidad Roleplay: Obtener personaje de la base de datos
⋮----
author: fullIdentity, // Nombre del Personaje o pushName
```

## File: src/comandos/general/aceptar.js
```javascript
// src/comandos/general/aceptar.js
⋮----
const numFromJid   = (jid)
const primerNombre = (n)
⋮----
export const run = async (contexto) =>
⋮----
// Actualizar parentesco en ambos usuarios globalmente
⋮----
// Lógica por defecto: Matrimonio (marry) global
```

## File: src/comandos/general/marry.js
```javascript
// src/comandos/general/marry.js
⋮----
const numFromJid   = (jid)
const primerNombre = (n)
⋮----
export const run = async (contexto) =>
⋮----
// Detectar objetivos: menciones o personaje (solo el primer personaje si hay varios args)
⋮----
// VALIDACIÓN DE INCESTO (Adopción / Kinship)
// 1. ¿Es su hijo/descendiente?
⋮----
// 2. ¿Es su padre/antecesor?
⋮----
// 3. ¿Son hermanos?
```

## File: src/comandos/general/relaciones.js
```javascript
// src/comandos/general/relaciones.js
⋮----
const numFromJid   = (jid)
const primerNombre = (n)
⋮----
export const run = async (contexto) =>
⋮----
// Algoritmo BFS para encontrar todos los miembros conectados (Poliamor/Grupo)
⋮----
// Ordenar alfabéticamente por el primer nombre del grupo para que la lista sea "limpia"
```

## File: src/comandos/mod/promover.js
```javascript
// src/comandos/mod/promover.js
⋮----
const numFromJid   = (jid)
⋮----
export const run = async (contexto) =>
⋮----
// Verificar si es Owner global (por .env o permisos: 3 en cualquier grupo)
⋮----
// Quitar admin en WhatsApp si se degrada a nivel 0
⋮----
// Dar admin en WhatsApp si se promueve a nivel 2 o superior
⋮----
// Actualizar permisos globalmente
```

## File: src/comandos/mod/quitar.js
```javascript
// src/comandos/mod/quitar.js
// !quitar nota #N @user | !quitar adv #N @user
⋮----
const numFromJid = (jid)
⋮----
export const run = async (contexto) =>
⋮----
// Determinar qué se quiere quitar: nota, adv o suge
const tipo = args[0]?.toLowerCase(); // "nota", "adv" o "suge"
⋮----
// Extraer número (#N o N)
⋮----
// Detectar objetivo (ignorando el tipo y el número)
⋮----
// Clonar array, eliminar el índice y guardar
```

## File: src/comandos/owner/mod.js
```javascript
// src/comandos/owner/mod.js
⋮----
const numFromJid = (jid)
⋮----
export const run = async (contexto) =>
⋮----
// Verificar si es Owner global
⋮----
// Se registra como mod globalmente
⋮----
// Dar admin en WhatsApp
```

## File: src/comandos/owner/removeowner.js
```javascript
// src/comandos/owner/removeowner.js
⋮----
const numFromJid = (jid)
⋮----
export const run = async (contexto) =>
```

## File: src/comandos/owner/test.js
```javascript
// src/comandos/owner/test.js
⋮----
export const run = async (contexto) =>
⋮----
// 1. Verificar si hay un mensaje citado con imagen
⋮----
// 2. Descargar la imagen citada
⋮----
// 3. Enviar al detector y obtener resultado
⋮----
// 4. Responder con el JSON exacto y detalles de depuración
```

## File: src/database/connection.js
```javascript
// src/database/connection.js
⋮----
const connectDB = async () =>
⋮----
serverSelectionTimeoutMS: 5000, // falla rápido si Mongo no responde
⋮----
family: 4, // Priorizar IPv4 para evitar lentitud en algunos entornos
⋮----
process.exit(1); // detiene el bot si no hay base de datos
⋮----
// Eventos de ciclo de vida — útiles para saber qué pasa después del arranque
```

## File: src/database/models/Config.js
```javascript
// src/database/models/Config.js
⋮----
communityId:   { type: String, index: true }, // ID de la comunidad (compartido entre grupos)
⋮----
antiporn:      { type: Boolean, default: false }, // Para links
antinsfw:      { type: Boolean, default: false }, // Para media (IA)
antigore:      { type: Boolean, default: false }, // Para media (CLIP)
⋮----
lockAntifiltro: { type: Boolean, default: false }, // Bloquea antinsfw y antigore
```

## File: src/handlers/commandHandler.js
```javascript
// src/handlers/commandHandler.js
⋮----
/**
 * Lee todas las subcarpetas de src/comandos/ y registra cada archivo .js en un Map.
 *
 * Nuevo contrato de cada archivo de comando:
 *   export const name       = "nombre";
 *   export const aliases    = ["alias1"];   // opcional
 *   export const onlyAdmin  = false;        // requiere ser admin de WA en el grupo
 *   export const onlyMod    = false;        // requiere admin WA + rango Mod en DB
 *   export const onlyOwner  = false;        // requiere rango Owner en DB
 *   export const run = async (contexto) => { ... };
 */
const cargarComandos = async () =>
```

## File: src/utils/userTarget.js
```javascript
/**
 * Detecta al usuario objetivo basado en prioridades:
 * 1. Mensaje citado (Quoted)
 * 2. Mención directa (@tag)
 * 3. Nombre del personaje (Búsqueda en MongoDB por Comunidad)
 * 4. Por defecto: El usuario que ejecuta el comando
 *
 * @param {Object} contexto - Contexto del comando (msg, from, sender, args, etc.)
 * @param {Object} User - Modelo de MongoDB de Usuario
 * @param {boolean} returnFullInfo - Si es true, retorna { jid, source }
 * @returns {Promise<string|Object>} - JID del usuario objetivo o { jid, source }
 */
export const userTarget = async (contexto, User, returnFullInfo = false) =>
⋮----
// 1. Prioridad: Mensaje citado (Quoted)
⋮----
// 2. Prioridad: Mención directa (@tag)
⋮----
// 3. Prioridad: Nombre del personaje (Búsqueda en MongoDB por Comunidad)
⋮----
// Si no se encontró por el primer arg, intentar con todo el texto (ej: !info Nombre Completo)
⋮----
// 4. Por defecto: El usuario que ejecuta el comando
```

## File: src/comandos/economia/daily.js
```javascript
// src/comandos/economia/daily.js
⋮----
export const run = async (contexto) =>
⋮----
// Si ya lo reclamó hoy
⋮----
// Lógica de racha (streak)
// Si pasaron menos de 48h, mantiene la racha
⋮----
// Si llegó a 7 días, premio doble
⋮----
user.dailyStreak = 0; // Reset racha tras el premio gordo
```

## File: src/comandos/economia/ricos.js
```javascript
// src/comandos/economia/ricos.js
⋮----
const numFromJid = (jid)
⋮----
export const run = async (contexto) =>
⋮----
// Agregación de MongoDB para unificar por JID en la comunidad actual
⋮----
// Lógica para elegir el mejor nombre disponible
```

## File: src/comandos/economia/slut.js
```javascript
// src/comandos/economia/slut.js
⋮----
export const run = async (contexto) =>
⋮----
const exito = Math.random() > 0.30; // 70% éxito (antes 60%)
⋮----
user.cooldowns.slut = new Date(ahora.getTime() + 3 * MS_EN_MIN); // 3 min cooldown éxito
⋮----
// 30% fallo: Asaltado o Detenido
⋮----
// Seguro de Pobreza: si tiene menos de $100, la pérdida es $0
⋮----
user.cooldowns.slut = new Date(ahora.getTime() + 15 * MS_EN_MIN); // 15 min cooldown fallo
```

## File: src/comandos/economia/work.js
```javascript
// src/comandos/economia/work.js
⋮----
export const run = async (contexto) =>
⋮----
const exito = Math.random() > 0.05; // 95% éxito
⋮----
user.cooldowns.work = new Date(ahora.getTime() + 2 * MS_EN_MIN); // 2 min cooldown
⋮----
// 5% fallo: Despedido por 10 min
```

## File: src/comandos/owner/claim.js
```javascript
// src/comandos/owner/claim.js
⋮----
export const run = async (contexto) =>
⋮----
// Se registra como owner en el grupo actual, lo que lo hace global
```

## File: src/utils/format.js
```javascript
// Módulo centralizado de formato visual - Estilo Beyonder v3
⋮----
// ─── Cabecera de menú (Con barras y adornos) ─────────────────────────────────
export const header = (titulo)
⋮----
// ─── Categoría (Centrada con adornos) ────────────────────────────────────────
export const category = (nombre)
⋮----
// ─── Línea de comando (Con sangría y descripción) ───────────────────────────
export const cmdLine = (emoji, cmd, desc)
⋮----
// ─── Aviso / Error / Confirmación (El formato del rayo) ─────────────────────
export const aviso = (mensaje)
⋮----
// ─── Sección de lista (Staff / Miembros) ─────────────────────────────────────
export const listSection = (titulo)
⋮----
// ─── Línea de ítem de lista (Sin etiquetas @ para evitar flood de notificaciones) ───────
export const listItem = (nombre, icono = "") =>
⋮----
// ─── Lógica de Íconos de Inactividad ─────────────────────────────────────────
export const inactividadIcon = (lastMessage) =>
⋮----
// ─── Interfaz de Info / Perfil ───────────────────────────────────────────────
export const infoHeader = () =>
⋮----
export const infoField = (campo, valor)
⋮----
// ─── Barra de Progreso Visual ────────────────────────────────────────────────
export const renderBar = (actual, max, size = 10) =>
⋮----
export const progressBar = (porcentaje, tamano = 10) =>
```

## File: Dockerfile
```dockerfile
# Imagen base con Python y Node.js
FROM nikolaik/python-nodejs:python3.12-nodejs20-slim

# Instalamos las librerías de sistema necesarias
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update --fix-missing && apt-get install -y --no-install-recommends \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    ffmpeg \
    git \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiamos archivos de dependencias
COPY package.json requirements.txt ./

# Instalamos dependencias de Python y Node.js
RUN pip install --no-cache-dir -r requirements.txt
RUN npm install

# Copiamos el resto del código
COPY . .

# Exponemos el puerto que usa Hugging Face (7860)
EXPOSE 7860

# El comando start ahora usa concurrently para lanzar ambos servicios
CMD ["npm", "start"]
```

## File: requirements.txt
```
fastapi
uvicorn
python-multipart
nudenet
pillow
onnxruntime
torch --index-url https://download.pytorch.org/whl/cpu
torchvision --index-url https://download.pytorch.org/whl/cpu
ftfy
regex
tqdm
git+https://github.com/openai/CLIP.git
transformers
accelerate
sentencepiece
pydantic
typing-extensions
```

## File: src/comandos/rp/rp.js
```javascript
// src/comandos/general/rp.js
// Cubre: !rp [nombre] | !rp quitar | !lista | !inactivos | !pedir | !buscados
⋮----
export const onlyMod   = false; // la validación de asignación se hace dentro del run
⋮----
const numFromJid   = (jid)
const normNombre   = (n)
⋮----
// ─────────────────────────────────────────────────────────────────────────────
⋮----
export const run = async (contexto) =>
⋮----
// ══════════════════════════════════════════════
//  !sinpersonaje — público
// ══════════════════════════════════════════════
⋮----
// ══════════════════════════════════════════════
//  !buscados — público
// ══════════════════════════════════════════════
⋮----
// ══════════════════════════════════════════════
//  !pedir [nombre] — público
// ══════════════════════════════════════════════
⋮----
// ══════════════════════════════════════════════
//  !lista — público con subcomandos
// ══════════════════════════════════════════════
⋮----
// Prioridad 1: Subcomando administrativo 'ban'
⋮----
// Prioridad 2: Búsqueda de personaje si hay argumentos
⋮----
// Prioridad 3: Lista general (sin argumentos)
// Mostramos todos los personajes de la DB global en una sola lista principal
⋮----
// ══════════════════════════════════════════════
//  !inactivos — público
// ══════════════════════════════════════════════
⋮----
// ══════════════════════════════════════════════
//  !rp quitar [@user] — Mod/Owner para otros,
//  cualquiera puede quitarse el suyo propio
// ══════════════════════════════════════════════
⋮----
// Si es !rp quitar @user o !rp quitar Personaje, detectamos el objetivo
// Quitamos "quitar" de los argumentos para que userTarget no lo confunda con un PJ
⋮----
// ══════════════════════════════════════════════
//  !rp [nombre] — SOLO Mod/Owner pueden asignar
// ══════════════════════════════════════════════
⋮----
// Objetivo: si hay mención o PJ asigna a ese, si no, al que lo usa
⋮----
// Limpiar el nombre
// Si el objetivo se encontró por mención o por el primer argumento, el nombre real empieza en args[1]
⋮----
// Verificar duplicado en la COMUNIDAD
⋮----
// Actualizar o crear registro en la COMUNIDAD
⋮----
// Si el nombre estaba en buscados → eliminar automáticamente
```

## File: src/comandos/general/menu.js
```javascript
// src/comandos/general/menu.js
⋮----
// ══════════════════════════════════════════════════════════════
//  !menu — todos los usuarios
// ══════════════════════════════════════════════════════════════
⋮----
// ══════════════════════════════════════════════════════════════
//  !smenu — Admins y Moderadores
// ══════════════════════════════════════════════════════════════
⋮----
// ══════════════════════════════════════════════════════════════
//  !pmenu — solo Owner
// ══════════════════════════════════════════════════════════════
⋮----
// ══════════════════════════════════════════════════════════════
⋮----
export const run = async (contexto) =>
```

## File: src/comandos/general/info.js
```javascript
// src/comandos/general/info.js
⋮----
const numFromJid = (jid)
⋮----
export const run = async (contexto) =>
⋮----
// ── Lógica de Comunidad (Unificado por JID + CommunityId) ──
// Si no existe, lo creamos (Autoreparación) con findOneAndUpdate (upsert) para evitar duplicados
⋮----
groupId: from // Referencia inicial
⋮----
// Si hubo una carrera por el upsert, intentamos buscarlo de nuevo
⋮----
// Determinar Rango Administrativo (WA)
⋮----
// Determinar Rango del Bot
```

## File: package.json
```json
{
  "name": "beyonder-v3",
  "version": "3.0.0",
  "description": "Beyonder v3 — Roleplay, IA y Moderación Organizada",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "start": "node index.js",
    "start:hf": "concurrently \"uvicorn main:app --host 0.0.0.0 --port 7860\" \"node index.js\"",
    "dev": "node --watch index.js"
  },
  "dependencies": {
    "@gradio/client": "^1.6.0",
    "@hapi/boom": "^10.0.1",
    "@huggingface/inference": "^4.13.15",
    "@tensorflow/tfjs-node": "^4.22.0",
    "@whiskeysockets/baileys": "^6.7.9",
    "axios": "^1.13.6",
    "canvas": "^3.2.2",
    "concurrently": "^9.2.1",
    "dotenv": "^16.4.5",
    "ffmpeg-static": "^5.2.0",
    "fluent-ffmpeg": "^2.1.3",
    "form-data": "^4.0.5",
    "groq-sdk": "^1.1.2",
    "mongodb": "^7.1.1",
    "mongoose": "^8.4.1",
    "ollama": "^0.6.3",
    "p-queue": "^9.1.0",
    "pino": "^9.2.0",
    "play-dl": "^1.9.7",
    "qrcode": "^1.5.4",
    "qrcode-terminal": "^0.12.0",
    "sharp": "^0.34.5",
    "uuid": "^13.0.0",
    "wa-sticker-formatter": "^4.0.3",
    "yt-search": "^2.13.1"
  },
  "devDependencies": {
    "pino-pretty": "^11.2.1"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

## File: src/config.js
```javascript
// src/config.js
⋮----
// Asegurar que dotenv lea el .env de la raíz, sin importar desde dónde se ejecute
⋮----
// Asegurar que PHONE_NUMBER sea un string limpio o null
```

## File: src/database/models/User.js
```javascript
// ─── Sub-esquemas ────────────────────────────────────────────────────────────
⋮----
// ─── Esquema principal ───────────────────────────────────────────────────────
⋮----
// ── Identificación ────────────────────────────────────────────────────────
⋮----
default:  "global", // Para usuarios que no están en una comunidad específica
⋮----
required: false, // Opcional para un sistema global
⋮----
// ── Permisos ──────────────────────────────────────────────────────────────
// 0: User | 1: Staff | 2: VIP | 3: Owner
⋮----
// ── Estadísticas ──────────────────────────────────────────────────────────
⋮----
// ── Economía ─────────────────────────────────────────────────────────────
⋮----
// ── Identidad Dinámica ────────────────────────────────────────────────────
⋮----
default: null, // { type: "maiz", plantedAt: Date, harvestAt: Date }
⋮----
// ── Notas y Advertencias ──────────────────────────────────────────────────
⋮----
// ── Sistema RP ────────────────────────────────────────────────────────────
⋮----
parent:   { type: String, default: null }, // JID del padre/madre
children: { type: [String], default: [] }, // JIDs de los hijos
⋮----
// ── AFK / Excusas ─────────────────────────────────────────────────────────
⋮----
// ── Contexto de IA (Ollama) ───────────────────────────────────────────────
⋮----
timestamps: true, // agrega createdAt y updatedAt automáticamente
⋮----
// ─── Índices adicionales ─────────────────────────────────────────────────────
⋮----
// ─── Modelo ───────────────────────────────────────────────────────────────────
```

## File: main.py
```python
app = FastAPI()
⋮----
# Configuración de Hugging Face
hf_token = os.getenv("HF_TOKEN")
⋮----
@app.get("/")
async def read_root()
⋮----
"""Interfaz simple para HF Spaces"""
⋮----
code = f.read().strip()
⋮----
@app.get("/qr")
async def get_qr()
⋮----
"""Sirve el archivo qr.png generado por el bot"""
⋮----
# Carga global de modelos al arrancar el Space (CPU)
device = "cpu"
# Optimización de hilos para CPU
⋮----
detector = NudeDetector()
⋮----
model_id = "Qwen/Qwen2.5-0.5B-Instruct"
⋮----
# Cargar con reintentos para evitar Rate Limit
def load_with_retry(load_func, *args, **kwargs)
⋮----
tokenizer = load_with_retry(AutoTokenizer.from_pretrained, model_id, token=hf_token)
# Usar float32 para CPU y optimizar el uso de memoria
llm_model = load_with_retry(
llm_pipeline = pipeline("text-generation", model=llm_model, tokenizer=tokenizer, device=-1)
⋮----
class IAMessage(BaseModel)
⋮----
role: str
content: str
⋮----
class IARequest(BaseModel)
⋮----
prompt: str
system_prompt: str
history: Optional[List[IAMessage]] = []
⋮----
def detect_clip_extra(image_path)
⋮----
# Cargar imagen y normalizar
⋮----
img = img.convert("RGB")
# 1. Reducir saturación un 10% para evitar sesgo de tonos cálidos
converter = ImageEnhance.Color(img)
img = converter.enhance(0.9)
# 2. Ajustar contraste
enhancer = ImageEnhance.Contrast(img)
img = enhancer.enhance(1.2)
image_input = preprocess(img).unsqueeze(0).to(device)
⋮----
# Etiquetas para validación semántica cruzada
text_descriptions = [
⋮----
"explicit sexual content",      # 0
"pornography and sexual acts",   # 1
"a person wearing a swimsuit",   # 2
"a person showing skin but dressed", # 3
"an anime character with tan skin",  # 4
"a photo of gore and blood",     # 5
"artwork or digital drawing",    # 6
"a normal photo of people",      # 7
"a landscape or object"          # 8
⋮----
text_tokens = clip.tokenize(text_descriptions).to(device)
⋮----
probs = logits_per_image.softmax(dim=-1).cpu().numpy()[0]
⋮----
# Lógica de Validación Semántica:
score_porn = float(probs[0] + probs[1])
score_dressed = float(probs[2] + probs[3] + probs[4])
score_gore = float(probs[5])
score_artwork = float(probs[6])
⋮----
is_porn = score_porn > 0.65 and score_porn > score_dressed
is_gore = score_gore > 0.55
⋮----
@app.post("/ia")
async def get_ia_response(req: IARequest)
⋮----
# Construir prompt siguiendo el template de Qwen
messages = [{"role": "system", "content": req.system_prompt}]
⋮----
# Generar respuesta usando el chat template del tokenizer
text = tokenizer.apply_chat_template(
⋮----
outputs = llm_pipeline(
⋮----
temperature=1.0, # Mayor temperatura para más creatividad sexual/morbosa
⋮----
repetition_penalty=1.1 # Evitar que se repita
⋮----
# Extraer solo la respuesta generada
generated_text = outputs[0]["generated_text"]
response_text = generated_text.split("<|im_start|>assistant\n")[-1].strip()
# Limpiar si el modelo genera el token de fin
response_text = response_text.replace("<|im_end|>", "").strip()
⋮----
@app.get("/")
def home()
⋮----
@app.post("/detect/nsfw")
async def detect_nsfw_endpoint(file: UploadFile = File(...))
⋮----
temp_path = f"temp_nsfw_{os.getpid()}.jpg"
⋮----
contents = await file.read()
⋮----
# Detección NSFW con NudeNet
nsfw_detections = detector.detect(temp_path)
⋮----
@app.post("/detect/gore")
async def detect_gore_endpoint(file: UploadFile = File(...))
⋮----
temp_path = f"temp_gore_{os.getpid()}.jpg"
⋮----
# Detección Gore con CLIP
clip_result = detect_clip_extra(temp_path)
⋮----
"is_porn_clip": clip_result["is_porn"], # Backup por si NudeNet falla
⋮----
@app.post("/detect/clip")
async def detect_clip_endpoint(file: UploadFile = File(...))
⋮----
temp_path = f"temp_clip_{os.getpid()}.jpg"
⋮----
# 1. Cargar imagen y normalizar
⋮----
# 2. Etiquetas para clasificación semántica (Picardía + Contexto)
⋮----
# Filtrar etiquetas con probabilidad > 15%
tags = [text_descriptions[i] for i, prob in enumerate(probs) if prob > 0.15]
⋮----
@app.post("/detect")
async def detect_image(file: UploadFile = File(...))
⋮----
# Mantener compatibilidad por si acaso, pero preferir endpoints específicos
temp_path = f"temp_all_{os.getpid()}.jpg"
```

## File: src/utils/detector.js
```javascript
/**
 * detector.js — Cliente HTTP para el servidor de IA (FastAPI)
 * Envía imágenes al servidor local para análisis ultra rápido.
 */
⋮----
// ── CONFIGURACIÓN INTERNA (HUGGING FACE / LOCAL) ──────────────────────────────
⋮----
const AI_CLIP_URL   = `${AI_BASE_URL}/detect/clip`; // Nueva ruta para CLIP puro
⋮----
// ... (NSFW_THRESHOLDS same)
⋮----
/**
 * Analiza una imagen con CLIP para obtener etiquetas descriptivas.
 * También identifica si el contenido es "morboso" o sugerente.
 */
export async function analyzeWithClip(buffer)
⋮----
// Lógica de detección de morbo (Picardía)
⋮----
// ── CONFIGURACIÓN DE UMBRALES (NudeNet) ──────────────────────────────────────
⋮----
/**
 * Escanea una imagen solo en busca de NSFW (NudeNet)
 */
export async function scanNsfw(buffer)
⋮----
/**
 * Escanea una imagen solo en busca de Gore (CLIP)
 */
export async function scanGore(buffer)
⋮----
// CLIP también puede detectar NSFW como backup
⋮----
/**
 * Analiza una imagen enviándola al servidor FastAPI.
 * Mantiene compatibilidad con el código anterior.
 */
export async function analyzeImage(buffer)
⋮----
// 1. Procesar detecciones NudeNet (NSFW)
⋮----
// 2. Procesar Detección CLIP Extra (Pornografía)
⋮----
// Mantener compatibilidad
export const detectNsfw = async (buffer) =>
⋮----
export const detectGore = async (buffer) =>
```

## File: src/services/iaService.js
```javascript
// src/services/iaService.js
⋮----
// Configuración de Groq SDK
⋮----
// Variable global de fatiga
⋮----
/**
 * Incrementa la fatiga global
 */
export const addFatigue = (points) =>
⋮----
/**
 * Reduce la fatiga cada 5 minutos
 */
⋮----
/**
 * Obtiene o crea la identidad única de Beyonder y aplica recuperación de paciencia
 */
async function getBeyonderIdentity()
⋮----
// Lógica de recuperación de paciencia por tiempo (1 punto cada 5 minutos de silencio)
⋮----
/**
 * Obtiene el contexto completo para la respuesta, incluyendo terceros si hay menciones
 */
async function getContext(jid, communityId, userName, mentionedJids = [])
⋮----
// Filtrar el propio JID del bot de las menciones si está presente
⋮----
// Generar contexto de terceros para la IA
⋮----
/**
 * Detecta si el usuario está intentando establecer un apodo para sí mismo de forma orgánica.
 */
export const detectNicknameIntent = async (message) =>
⋮----
/**
 * Evalúa una petición de apodo basándose en afinidad, contexto visual y morbo.
 */
export const evaluateNickname = async (jid, communityId, userName, proposedNick, affinity, visualTags = [], isMorboso = false) =>
⋮----
export const getAiResponse = async (sender, from, communityId, userName, message, history = [], forced = false, mentionedJids = []) =>
⋮----
// 1. Obtener contexto completo
⋮----
// ... (lógica de fatiga igual)
⋮----
// 3. Construir System Prompt Dinámico con Opiniones, Slang y Terceros
⋮----
// 4. Actualizar Fatiga y Paciencia en la DB
⋮----
// 5. Formatear Historial (Últimos 6 mensajes)
⋮----
// 6. Llamada a Groq SDK
⋮----
// 7. Extraer respuesta real quitando el <thought>
⋮----
// 7.5 Limpieza de estilo (quitar puntos finales)
⋮----
// 8. Detección de acciones (Bautizo)
```

## File: index.js
```javascript
import "dotenv/config";  // ← PRIMERA LÍNEA, antes de todo
// index.js — Beyonder v3 | Punto de entrada principal
⋮----
// ── Manejo Global de Errores para evitar crasheos por Connection Closed ─────
⋮----
// No salimos del proceso para que el loop de reconexión de Baileys trabaje
⋮----
// ════════════════════════════════════════════════════════════════════════════
//  1. CONEXIÓN A WHATSAPP (Baileys)
// ════════════════════════════════════════════════════════════════════════════
⋮----
const conectarWhatsApp = async (comandos) =>
⋮----
// ── Lógica de Código de Vinculación (Pairing Code) ───────────────────────
⋮----
// También guardar en un archivo para acceso web
⋮----
// ── Guardar credenciales al actualizarse ────────────────────────────────
⋮----
// ── Gestión de la conexión / reconexión ─────────────────────────────────
⋮----
// Guardar QR como imagen para visualización en web (HF Spaces)
⋮----
// Borrar archivos temporales al conectar
⋮----
// Si el código es 401 (loggedOut), eliminamos sesión.
// Pero a veces Baileys da otros códigos en cierres normales de HF.
⋮----
// Como usamos MongoDB para auth, borramos la colección 'auth'
⋮----
// ════════════════════════════════════════════════════════════════════════
//  2. ESCUCHADOR DE MENSAJES
// ════════════════════════════════════════════════════════════════════════
⋮----
// ── Gestión de Eventos de Grupo ──────────────────────────────────────────
⋮----
// ── 3. SISTEMA DE INICIATIVA (Cada 1 hora) ───────────────────────────────
⋮----
// ════════════════════════════════════════════════════════════════════════════
//  3. ARRANQUE PRINCIPAL
//     Orden garantizado: BD → Comandos → WhatsApp
// ════════════════════════════════════════════════════════════════════════════
const main = async () =>
⋮----
// 1. Base de datos primero — si falla, el proceso termina (ver connection.js)
⋮----
// 2. Cargar todos los comandos antes de abrir el socket
⋮----
// 3. Conectar a WhatsApp
```

## File: src/events/messages.js
```javascript
// src/events/messages.js
⋮----
// ── Configuración de play-dl con Cookies ─────────────────────────────────────
⋮----
// Configurar ffmpeg
⋮----
// ── 0. GESTIÓN DE MEMORIA IA (Historial por chat) ──────────────────────────
⋮----
// ── Cola de Procesamiento IA ──────────────────────────────────────────────────
const iaQueue = new PQueue({ concurrency: 1 }); // Procesar de 1 en 1 para no saturar
const userRequests = new Map(); // Para rastrear envíos masivos por usuario
⋮----
// ── AntiFlood en RAM ──────────────────────────────────────────────────────────
// groupId:userId → [timestamps]
⋮----
// from → [timestamps]
⋮----
const FLOOD_WINDOW = 5000; // 5 segundos
⋮----
// Limpiar groupMessageTracker también (ventana de 10s)
⋮----
// ── Helper: obtener metadatos del grupo con caché 30s ─────────────────────────
⋮----
async function getGroupMeta(sock, groupId)
⋮----
// ── Helper: verificar si el sender es admin WA ────────────────────────────────
function isWAAdmin(meta, jid)
⋮----
// ── Manejador de Selecciones de Búsqueda ────────────────────────────────────
async function handleSearchSelection(sock, msg, from, sender, text)
⋮----
// Determinar modo de descarga: si incluye 'mp4' es video, si no es audio
⋮----
// Limpiar búsqueda
⋮----
// Para video usamos play.video_info y stream
⋮----
// Para audio optimizado
⋮----
// ─────────────────────────────────────────────────────────────────────────────
⋮----
const handleMessages = async (
⋮----
// Guardar estructura original para descarga de media
⋮----
// ── Normalización de Mensaje (viewOnce, ephemeral, etc.) ──
⋮----
// Eliminar wrappers (viewOnce, ephemeral, etc.)
⋮----
// ── Variables Globales del Mensaje ──
⋮----
// ── 2. Extraer texto y metadatos básicos ───────────────────────────
⋮----
// ── 1.2 Procesamiento de Media (Visión Local) ──
⋮----
// 1. Escaneo NSFW/Gore
⋮----
// Beyonder se ofende y baja afinidad
⋮----
// 2. Análisis CLIP para contexto y morbo
⋮----
// Concatenar contexto visual al texto si existe
⋮----
// ── 1.4 Recolección de Jerga (Mimetismo) ──
⋮----
if (Math.random() > 0.7) { // Muestreo aleatorio para no saturar DB
⋮----
// ── 1. PRIORIDAD: Contador de Mensajes, Afinidad y Autoreparación ──
⋮----
if (e.code !== 11000) { // Ignorar error de duplicado por concurrencia
⋮----
// Actualizar Afinidad e Interacciones
⋮----
// ── 1.1. Monitoreo de Tensión y "Peleas" ──
⋮----
// Detección de gritos (Mayúsculas)
⋮----
// Actualizar última actividad
⋮----
// ── 1.3 Gestión de Promesas (Recordatorios) ──
⋮----
// Si el bot detecta que hizo una promesa en su respuesta (esto se procesará después)
// Pero aquí podemos revisar si hay promesas pendientes para este usuario
⋮----
// ── 2.5 Spawn de Regalo Aleatorio (!claim) ──
⋮----
// ── 3. Prioridad del Interruptor (!beyonder on) ───────────────────────
⋮----
// ── 4. Verificar si el bot está activo (Bypass para Staff) ───────────
⋮----
// ── 5. Filtrado de Media (IA) ─────────────────────────────────────────
⋮----
// LANZAR EL ANÁLISIS SIN "AWAIT" PARA NO BLOQUEAR EL BOT (UX Optimización)
⋮----
// console.log(`[IA] Análisis de ${msg.type} iniciado en segundo plano para @${sender.split("@")[0]}`);
⋮----
// ── 6. Otros Filtros (AntiPorn Link, AntiNSFW Link, AntiFlood, AntiLink) ──
⋮----
// Auto-Descarga de Links (Cobalt)
⋮----
// A. Verificar Baneado
⋮----
// B. AntiFlood
⋮----
// ── SISTEMA DE APELACIÓN (CUARENTENA) ──
⋮----
// C. Filtros de Texto (Enlaces)
⋮----
// ── 7. Disparador de IA (Si no es comando) ─────────────────────────
⋮----
// ── 1.5 Filtro de Relevancia Social (¿Debería hablar?) ──
⋮----
// Track group speed
⋮----
// ── 1.6 Módulo de Escucha Pasiva de Identidad ──
⋮----
// Actualizar Affinity
⋮----
// Actualizar User (Identidad Dinámica)
⋮----
// Regla de Saliencia: Si la charla está rápida, guarda en silencio.
// Si está tranquila o es mención directa, responde.
⋮----
continue; // No procesar más este mensaje si ya respondimos sobre el apodo
⋮----
// Simular delay natural
⋮----
// Extraer menciones de la respuesta de la IA (JIDs que empiecen con @)
⋮----
// ── Procesar Acciones (Bautizo) ──
⋮----
// ── Procesar Reacciones (Neko.best) ──
⋮----
// ── Gestión de Promesas (Detectar intenciones) ──
⋮----
// ── Simulación de Escritura Humana y Fragmentación ──
⋮----
// Calcular delay basado en longitud (promedio 10 chars/seg)
⋮----
// Pequeña pausa entre fragmentos
⋮----
// Guardar en historial
⋮----
// ── 8. Manejo de Comandos ──────────────────────────────────────────
⋮----
// ── 8.5 Verificación de Economía Activa ───────────────────────────
⋮----
return; // No responder nada si la economía está en OFF
⋮----
// ── 9. Verificación de Cárcel (Solo bloquea economía) ───────────────
⋮----
// Si el tiempo expiró, liberar automáticamente
⋮----
// Sumar fatiga por comando
⋮----
reply:  async (text, mentions = []) =>
send:   async (text, mentions = []) =>
react:  async (emoji) =>
⋮----
/**
 * Procesa imágenes, stickers y videos en segundo plano usando Worker Threads.
 * No bloquea el hilo principal de WhatsApp.
 */
async function procesarMediaBackground(sock, msg, from, sender, cfg, meta, userName)
⋮----
// 1. Descargar el medio
⋮----
// 2. Extraer frame si es video
⋮----
// 3. Lanzar Worker Thread para el análisis (Sharp + IA)
// Pasamos el path absoluto del worker
⋮----
env: process.env // Pasar variables de entorno al worker
⋮----
// 4. Actuar según el resultado
⋮----
// ── CASO: Seguridad Alta (>85% o >95% Artwork) ──
⋮----
// ── CASO: Duda (65% - 85%) ──
⋮----
// 5. Limpieza de seguridad (Garantizar que no quedan temporales)
```
