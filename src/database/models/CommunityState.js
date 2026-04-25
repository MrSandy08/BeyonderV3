// src/database/models/CommunityState.js
import { Schema, model } from "mongoose";

const CommunityStateSchema = new Schema(
  {
    communityId: { type: String, required: true, unique: true },
    mood: { type: String, default: "Neutral" }, // Triste, Eufórico, Enojado, Neutral
    tension: { type: Number, default: 0 }, // 0 a 100
    lastMajorEvent: {
      type: { type: String }, // kick, join, fight, silence
      description: { type: String },
      timestamp: { type: Date, default: Date.now },
      participant: { type: String }
    },
    lastActivity: { type: Date, default: Date.now }
  },
  { versionKey: false, timestamps: true }
);

const CommunityState = model("CommunityState", CommunityStateSchema);

export default CommunityState;
