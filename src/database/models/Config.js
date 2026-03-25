// src/database/models/Config.js
import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    groupId:       { type: String, required: true, unique: true, index: true },
    esPrincipal:   { type: Boolean, default: false },
    esSecundaria:  { type: Boolean, default: false },
    botActivo:     { type: Boolean, default: true  },
    antilink:      { type: Boolean, default: false },
    antiporn:      { type: Boolean, default: false }, // Para links
    antinsfw:      { type: Boolean, default: false }, // Para media (IA)
    antigore:      { type: Boolean, default: false }, // Para media (CLIP)
    antiflood:     { type: Boolean, default: false },
    lockRp:        { type: Boolean, default: false },
    lockAntilink:  { type: Boolean, default: false },
    lockAntiporn:  { type: Boolean, default: false },
    lockAntinsfw:  { type: Boolean, default: false },
    lockAntigore:  { type: Boolean, default: false },
    lockAntifiltro: { type: Boolean, default: false }, // Bloquea antinsfw y antigore
    lockAntiflood: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

let Config;
try   { Config = mongoose.model("Config"); }
catch { Config = mongoose.model("Config", schema); }
export default Config;
