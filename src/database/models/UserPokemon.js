import { Schema, model } from "mongoose";

const UserPokemonSchema = new Schema(
  {
    owner: {
      type:     String,
      required: true,
      index:    true,
    },
    groupId: {
      type:     String,
      required: true,
      index:    true,
    },
    pokeID: {
      type:     Number,
      required: true,
    },
    nickname: {
      type:    String,
      trim:    true,
    },
    xp: {
      type:    Number,
      default: 0,
    },
    level: {
      type:    Number,
      default: 5,
    },
    hp_current: {
      type:    Number,
      default: 20,
    },
    hp_max: {
      type:    Number,
      default: 20,
    },
    atk: {
      type:    Number,
      default: 10,
    },
    def: {
      type:    Number,
      default: 10,
    },
    spd: {
      type:    Number,
      default: 10,
    },
    energy: {
      type:    Number,
      default: 100,
    },
    lastRest: {
      type:    Date,
      default: Date.now,
    },
    isFavorite: {
      type:    Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

UserPokemonSchema.index({ owner: 1, groupId: 1 });

const UserPokemon = model("UserPokemon", UserPokemonSchema);

export default UserPokemon;
