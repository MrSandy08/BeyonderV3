// src/rpg/models/Player.js
import mongoose from "mongoose";

const PlayerSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  groupId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  class: { type: String, default: "Aventurero" },
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  hp: { type: Number, default: 100 },
  maxHp: { type: Number, default: 100 },
  mana: { type: Number, default: 50 },
  maxMana: { type: Number, default: 50 },
  gold: { type: Number, default: 100 },
  stats: {
    strength: { type: Number, default: 5 },
    dexterity: { type: Number, default: 5 },
    intelligence: { type: Number, default: 5 },
    charisma: { type: Number, default: 5 }
  },
  equipment: {
    weapon: { type: Object, default: null },
    armor: { type: Object, default: null },
    accessory: { type: Object, default: null }
  },
  inventory: { type: [Object], default: [] },
  location: { type: String, default: "Pueblo Inicial" },
  quests: { type: [Object], default: [] },
  combatState: { type: Object, default: null },
  storyFlags: { type: [String], default: [] }
}, { timestamps: true });

PlayerSchema.index({ userId: 1, groupId: 1 }, { unique: true });

export default mongoose.model("Player", PlayerSchema);
