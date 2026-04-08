// src/database/models/GroupSlang.js
import { Schema, model } from "mongoose";

const GroupSlangSchema = new Schema(
  {
    communityId: { type: String, required: true, index: true },
    word: { type: String, required: true },
    count: { type: Number, default: 1 },
    lastUsed: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

// Índice único por comunidad y palabra
GroupSlangSchema.index({ communityId: 1, word: 1 }, { unique: true });

const GroupSlang = model("GroupSlang", GroupSlangSchema);

export default GroupSlang;
