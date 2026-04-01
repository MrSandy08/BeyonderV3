import { Schema, model } from "mongoose";

// ─── Sub-esquemas ────────────────────────────────────────────────────────────

const NotaSchema = new Schema(
  {
    contenido: { type: String, required: true },
    autor:     { type: String, required: true },
    fecha:     { type: Date,   default: Date.now },
  },
  { _id: false }
);

const AdvSchema = new Schema(
  {
    contenido: { type: String, required: true },
    autor:     { type: String, required: true },
    fecha:     { type: Date,   default: Date.now },
  },
  { _id: false }
);

const AiMessageSchema = new Schema(
  {
    role:    { type: String, enum: ["user", "assistant", "system"], required: true },
    content: { type: String, required: true },
    fecha:   { type: Date,   default: Date.now },
  },
  { _id: false }
);

// ─── Esquema principal ───────────────────────────────────────────────────────

const UserSchema = new Schema(
  {
    // ── Identificación ────────────────────────────────────────────────────────
    jid: {
      type:     String,
      required: true,
      trim:     true,
      index:    true,
    },
    groupId: {
      type:     String,
      required: true,
      trim:     true,
      index:    true,
    },
    nombre: {
      type:    String,
      default: "Usuario",
      trim:    true,
    },

    // ── Permisos ──────────────────────────────────────────────────────────────
    // 0: User | 1: Staff | 2: VIP | 3: Owner
    permisos: {
      type:    Number,
      enum:    [0, 1, 2, 3],
      default: 0,
    },

    // ── Estadísticas ──────────────────────────────────────────────────────────
    msgCount: {
      type:    Number,
      default: 0,
    },
    lastMessage: {
      type:    Date,
      default: null,
    },

    // ── Notas y Advertencias ──────────────────────────────────────────────────
    notas: {
      type:    [NotaSchema],
      default: [],
    },
    advs: {
      type:    [AdvSchema],
      default: [],
    },

    // ── Sistema RP ────────────────────────────────────────────────────────────
    personaje: {
      type:    String,
      default: null,
      trim:    true,
    },
    parejas: {
      type:    [String],
      default: [],
    },

    // ── AFK / Excusas ─────────────────────────────────────────────────────────
    afk: {
      motivo:      { type: String,  default: null },
      fechaExpira: { type: Date,    default: null },
      activa:      { type: Boolean, default: false },
    },

    // ── Contexto de IA (Ollama) ───────────────────────────────────────────────
    aiContext: {
      type:    [AiMessageSchema],
      default: [],
    },

    // ── Pokémon RPG ──────────────────────────────────────────────────────────
    started: {
      type:    Boolean,
      default: false,
    },
    balls: {
      type:    Number,
      default: 5,
    },

    // ── Economía y Minería ────────────────────────────────────────────────────
    lastMine: { type: Number, default: 0 },
    lastFish: { type: Number, default: 0 },
    gold:     { type: Number, default: 500 },
    pickaxeDurability: { type: Number, default: 100 },
    maxWeight: { type: Number, default: 50 },
    inventory: {
      minerals: {
        stone:         { type: Number, default: 0 },
        coal:          { type: Number, default: 0 },
        copper:        { type: Number, default: 0 },
        iron:          { type: Number, default: 0 },
        ruby_sapphire: { type: Number, default: 0 },
        diamond:       { type: Number, default: 0 },
        fire_stone:    { type: Number, default: 0 },
        water_stone:   { type: Number, default: 0 },
        thunder_stone: { type: Number, default: 0 },
      },
      fish: {
        common:    { type: Number, default: 0 },
        puffer:    { type: Number, default: 0 },
        salmon:    { type: Number, default: 0 },
        eel:       { type: Number, default: 0 },
        leviathan: { type: Number, default: 0 },
        kraken:    { type: Number, default: 0 },
      },
    },
  },
  {
    timestamps: true, // agrega createdAt y updatedAt automáticamente
    versionKey: false,
  }
);

// ─── Índices adicionales ─────────────────────────────────────────────────────

UserSchema.index({ jid: 1, groupId: 1 }, { unique: true });
UserSchema.index({ permisos: 1 });
UserSchema.index({ "afk.activa": 1 });
UserSchema.index({ personaje: 1, groupId: 1 });

// ─── Modelo ───────────────────────────────────────────────────────────────────

const User = model("User", UserSchema);

export default User;