// src/database/models/BeyonderCore.js
import { Schema, model } from "mongoose";

const BeyonderCoreSchema = new Schema(
  {
    identity: {
      likes: [{ type: String }], // Ej: ["lluvia", "gatos", "programación"]
      dislikes: [{ type: String }], // Ej: ["reggaetón", "calor", "admins pesados"]
      values: [{ type: String }], // Ej: ["lealtad", "sarcasmo", "eficiencia"]
      baseMood: { type: String, default: "Neutral" }
    },
    status: {
      patience: { type: Number, default: 100 }, // 0 a 100
      fatigue: { type: Number, default: 0 }, // 0 a 100
      lastSleep: { type: Date, default: Date.now }
    },
    promises: [{
      jid: { type: String },
      communityId: { type: String },
      content: { type: String },
      dueAt: { type: Date },
      completed: { type: Boolean, default: false }
    }]
  },
  { versionKey: false, timestamps: true }
);

const BeyonderCore = model("BeyonderCore", BeyonderCoreSchema);

export default BeyonderCore;
