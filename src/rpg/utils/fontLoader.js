// src/rpg/utils/fontLoader.js
import { registerFont } from "canvas";
import { join } from "path";
import { existsSync } from "fs";

/**
 * Registra la fuente medieval para Canvas.
 * Asegura que no dependa de fuentes del sistema Linux.
 */
export const loadFonts = () => {
  const fontPath = join(process.cwd(), "assets", "fonts", "font.ttf");

  if (existsSync(fontPath)) {
    try {
      registerFont(fontPath, { family: "Medieval" });
      console.log("✅ Fuente 'Medieval' registrada correctamente.");
    } catch (e) {
      console.error("❌ Error al registrar la fuente medieval:", e.message);
    }
  } else {
    console.warn(`⚠️  No se encontró la fuente en ${fontPath}. Se usará la fuente por defecto.`);
  }
};
