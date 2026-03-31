// src/database/models/Affinity.js
import { Schema, model } from "mongoose";

const AffinitySchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    groupId: { type: String, required: true, index: true },
    points: { type: Number, default: 0 },
    status: { type: String, default: "Neutral" },
  },
  { versionKey: false, timestamps: true }
);

// Índice compuesto para buscar afinidad por usuario en un grupo específico
AffinitySchema.index({ userId: 1, groupId: 1 }, { unique: true });

const Affinity = model("Affinity", AffinitySchema);

export default Affinity;
