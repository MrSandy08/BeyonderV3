// src/rpg/models/GroupRPG.js
import mongoose from "mongoose";

const GroupSchema = new mongoose.Schema({
  groupId: { type: String, required: true, unique: true, index: true },
  enabled: { type: Boolean, default: true },
  chapter: { type: Number, default: 1 },
  currentScene: { type: String, default: "prologo" },
  location: { type: String, default: "Pueblo Inicial" },
  activeEnemies: { type: [Object], default: [] },
  shopPool: { type: [Object], default: [] },
  npcState: { type: Object, default: {} },
  history: { type: [String], default: [] }
}, { timestamps: true });

export default mongoose.model("GroupRPG", GroupSchema);
