import { Schema, model } from "mongoose";

const CombatSchema = new Schema(
  {
    jid: {
      type:     String,
      required: true,
      index:    true,
    },
    groupId: {
      type:     String,
      required: true,
      index:    true,
    },
    playerPokemonId: {
      type:     Schema.Types.ObjectId,
      ref:      "UserPokemon",
      required: true,
    },
    enemy: {
      pokeID:     { type: Number, required: true },
      name:       { type: String, required: true },
      level:      { type: Number, required: true },
      hp_current: { type: Number, required: true },
      hp_max:     { type: Number, required: true },
      atk:        { type: Number, required: true },
      def:        { type: Number, required: true },
      spd:        { type: Number, required: true },
      types:      { type: [String], default: [] },
    },
    playerHP: {
      type:     Number,
      required: true,
    },
    turn: {
      type:    String, // "player" | "enemy"
      default: "player",
    },
    menu: {
      type:    String, // "main" | "fight"
      default: "main",
    },
    isActive: {
      type:    Boolean,
      default: true,
    },
    lastUpdate: {
      type:    Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

CombatSchema.index({ jid: 1, groupId: 1, isActive: 1 });

const Combat = model("Combat", CombatSchema);

export default Combat;
