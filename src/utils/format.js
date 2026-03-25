// Módulo centralizado de formato visual - Estilo Beyonder v3

// ─── Cabecera de menú (Con barras y adornos) ─────────────────────────────────
export const header = (titulo) => 
`‎ ‎ ‎ ‎ ‎ ━━━━━━━━ ˚₊‧ ⚡︎ ‧₊˚ ━━━━━━━━
        ⤹ ⊹ ୨୧ ${titulo.toUpperCase()} ⿻ ₊˚๑
     ━━━━━━━━━━━━━━━━━━━━━━━`;

// ─── Categoría (Centrada con adornos) ────────────────────────────────────────
export const category = (nombre) =>
`\n                     𝄄 𓈒   ⁺ ${nombre}   𓏼\n`;

// ─── Línea de comando (Con sangría y descripción) ───────────────────────────
export const cmdLine = (emoji, cmd, desc) =>
`       𝄄➥𓈒   ⁺ ${emoji}  *!${cmd}*
       𝄄   _${desc}_\n`;

// ─── Aviso / Error / Confirmación (El formato del rayo) ─────────────────────
export const aviso = (mensaje) =>
`                 𑂯 ( ⚡ ) ⁺ 𓈒  ׁ     
 𝄄➥ ${mensaje}
       @𝐀𝗍𝗍𝖾 : ℬeyonder`;

// ─── Sección de lista (Staff / Miembros) ─────────────────────────────────────
export const listSection = (titulo) =>
`                     𝄄 𓈒   ⁺ ${titulo}   𓏼\n`;

// ─── Línea de ítem de lista (Sin etiquetas @ para evitar flood de notificaciones) ───────
export const listItem = (nombre, icono = "") => {
  return ` 𝄄➥ *${nombre}*${icono ? " " + icono : ""}\n`;
};

// ─── Lógica de Íconos de Inactividad ─────────────────────────────────────────
export const inactividadIcon = (lastMessage) => {
  if (!lastMessage) return "▪️";
  const dias = (Date.now() - new Date(lastMessage).getTime()) / 86400000;
  if (dias >= 7) return "🔸";
  if (dias >= 3) return "🔹";
  return "";
};

// ─── Interfaz de Info / Perfil ───────────────────────────────────────────────
export const infoHeader = () => {
  return ` ‎ ‎ ‎             𐔌 . ▧ˎˊ˗     ⿻๋࣭ ⭑    ♯.ᐟ ֹ ₊ ꒱ ‎ ‎`;
};

export const infoField = (campo, valor) =>
`\n𝄄➥ ${campo}: ${valor}`;

// ─── Barra de Progreso Visual ────────────────────────────────────────────────
export const progressBar = (porcentaje, tamano = 10) => {
  const completado = Math.round((tamano * porcentaje) / 100);
  const vacio = tamano - completado;
  const barra = "▰".repeat(completado) + "▱".repeat(vacio);
  return `[${barra}] ${porcentaje}%`;
};