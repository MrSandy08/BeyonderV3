// src/rpg/models/GlobalItem.js
import mongoose from "mongoose";

const GlobalItemSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, default: "" },
  type: { type: String, enum: ["weapon", "armor", "potion", "consumable", "material"], required: true },
  price: { type: Number, required: true },
  weight: { type: Number, default: 0 },
  stats: {
    attack: { type: Number, default: 0 },
    defense: { type: Number, default: 0 },
    heal: { type: Number, default: 0 },
    mana: { type: Number, default: 0 }
  },
  rarity: { type: String, enum: ["common", "uncommon", "rare", "epic", "legendary"], default: "common" }
}, { versionKey: false });

export default mongoose.model("GlobalItem", GlobalItemSchema);
