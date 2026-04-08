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
    },
    communityId: {
      type:     String,
      required: true,
      default:  "global", // Para usuarios que no están en una comunidad específica
      index:    true,
    },
    groupId: {
      type:     String,
      required: false, // Opcional para un sistema global
      trim:     true,
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

    // ── Economía ─────────────────────────────────────────────────────────────
    money: {
      type:    Number,
      default: 0,
    },
    bank: {
      type:    Number,
      default: 0,
    },
    cooldowns: {
      work:        { type: Date, default: null },
      slut:        { type: Date, default: null },
      daily:       { type: Date, default: null },
      minar:       { type: Date, default: null },
      pescar:      { type: Date, default: null },
      atracar:     { type: Date, default: null },
      cazar:       { type: Date, default: null },
      extorsionar: { type: Date, default: null },
      suerte:      { type: Date, default: null },
      crimen:      { type: Date, default: null },
      robar:       { type: Date, default: null },
    },
    isJailed: {
      type:    Boolean,
      default: false,
    },
    jailUntil: {
      type:    Date,
      default: null,
    },

    // ── Identidad Dinámica ────────────────────────────────────────────────────
    identidad: {
      nombre_real: { type: String, default: null },
      apodo_actual: { type: String, default: null },
      historial_apodos: [{ type: String }],
      apodos_rechazados: [{ type: String }]
    },
    dailyStreak: {
      type:    Number,
      default: 0,
    },
    lastDaily: {
      type:    Date,
      default: null,
    },
    crop: {
      type:    Object,
      default: null, // { type: "maiz", plantedAt: Date, harvestAt: Date }
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
    kinship: {
      parent:   { type: String, default: null }, // JID del padre/madre
      children: { type: [String], default: [] }, // JIDs de los hijos
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
  },
  {
    timestamps: true, // agrega createdAt y updatedAt automáticamente
    versionKey: false,
  }
);

// ─── Índices adicionales ─────────────────────────────────────────────────────

UserSchema.index({ jid: 1, communityId: 1 }, { unique: true });
UserSchema.index({ permisos: 1 });
UserSchema.index({ "afk.activa": 1 });
UserSchema.index({ personaje: 1 });
UserSchema.index({ money: -1 });
UserSchema.index({ msgCount: -1 });
UserSchema.index({ communityId: 1 });

// ─── Modelo ───────────────────────────────────────────────────────────────────

const User = model("User", UserSchema);

export default User;