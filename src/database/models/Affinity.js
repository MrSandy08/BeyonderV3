// src/database/models/Affinity.js
import { Schema, model } from "mongoose";

const AffinitySchema = new Schema(
  {
    jid: { type: String, required: true },
    communityId: { type: String, required: true },
    points: { type: Number, default: 0 }, // -100 a 100
    status: { type: String, default: "Desconocido" }, // Mejor amigo, Enemigo, Desconocido, etc.
    interactions: { type: Number, default: 0 },
    lastInteraction: { type: Date, default: Date.now },
    isFavorite: { type: Boolean, default: false },
    nickname: {
      proposed: { type: String, default: null },
      accepted: { type: Boolean, default: false },
      final:    { type: String, default: null },
      rejectionReason: { type: String, default: null }
    }
  },
  { versionKey: false, timestamps: true }
);

// Índice para buscar afinidad por usuario en una comunidad específica
AffinitySchema.index({ jid: 1, communityId: 1 }, { unique: true });
AffinitySchema.index({ jid: 1 });
AffinitySchema.index({ communityId: 1 });

const Affinity = model("Affinity", AffinitySchema);

export default Affinity;
