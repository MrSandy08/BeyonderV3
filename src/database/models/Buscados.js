// src/database/models/Buscados.js
import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    personaje: { type: String, required: true },
    pedidoPor: { type: String },
    fecha:     { type: Date, default: Date.now },
  },
  { versionKey: false }
);

let Buscados;
try   { Buscados = mongoose.model("Buscados"); }
catch { Buscados = mongoose.model("Buscados", schema); }
export default Buscados;
