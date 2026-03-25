// src/database/models/BanList.js
import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    jid:        { type: String, required: true, unique: true },
    numero:     { type: String },
    motivo:     { type: String, default: "Sin motivo" },
    bannadoPor: { type: String },
    fecha:      { type: Date, default: Date.now },
  },
  { versionKey: false }
);

let BanList;
try   { BanList = mongoose.model("BanList"); }
catch { BanList = mongoose.model("BanList", schema); }
export default BanList;
