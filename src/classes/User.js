// src/classes/User.js
import UserSchema from "../database/models/User.js";

/**
 * Beyonder v4: User Wrapper Class
 * Centraliza la lógica de negocio del usuario para evitar repetición en comandos.
 */
class User {
  constructor(data) {
    this.data = data; // Datos del modelo de Mongoose (lean object)
    this.jid = data.jid;
    this.communityId = data.communityId;
  }

  /**
   * Obtiene un usuario de la DB y lo envuelve en la clase.
   */
  static async get(jid, communityId) {
    const data = await UserSchema.findOne({ jid, communityId }).lean();
    if (!data) return null;
    return new User(data);
  }

  /**
   * Crea o actualiza un usuario (upsert) y lo devuelve envuelto.
   */
  static async findOrCreate(jid, communityId, extraData = {}) {
    const data = await UserSchema.findOneAndUpdate(
      { jid, communityId },
      { $setOnInsert: extraData },
      { upsert: true, new: true, lean: true }
    );
    return new User(data);
  }

  // ── Métodos de Economía ────────────────────────────────────────────────────

  async addMoney(amount) {
    this.data.money += amount;
    return await UserSchema.updateOne(
      { jid: this.jid, communityId: this.communityId },
      { $inc: { money: amount } }
    );
  }

  async removeMoney(amount) {
    if (this.data.money < amount) return false;
    this.data.money -= amount;
    return await UserSchema.updateOne(
      { jid: this.jid, communityId: this.communityId },
      { $inc: { money: -amount } }
    );
  }

  // ── Métodos de Permisos ────────────────────────────────────────────────────

  isOwner(ownerList = []) {
    return ownerList.includes(this.jid) || this.data.permisos === 3;
  }

  isMod() {
    return this.data.permisos >= 2;
  }

  isHelper() {
    return this.data.permisos >= 1;
  }

  // ── Métodos de Perfil ──────────────────────────────────────────────────────

  getPersonaje() {
    return this.data.personaje || "Sin asignar";
  }

  getStats() {
    return {
      money: this.data.money || 0,
      bank: this.data.bank || 0,
      total: (this.data.money || 0) + (this.data.bank || 0),
      msgCount: this.data.msgCount || 0,
      advCount: (this.data.advs || []).length
    };
  }

  // ── Métodos de Cooldowns ──────────────────────────────────────────────────

  getCooldown(key) {
    return this.data.cooldowns?.[key] || new Date(0);
  }

  async setCooldown(key, durationMs) {
    const expires = new Date(Date.now() + durationMs);
    if (!this.data.cooldowns) this.data.cooldowns = {};
    this.data.cooldowns[key] = expires;
    
    return await UserSchema.updateOne(
      { jid: this.jid, communityId: this.communityId },
      { $set: { [`cooldowns.${key}`]: expires } }
    );
  }

  isCooldownActive(key) {
    const expires = this.getCooldown(key);
    return expires > new Date();
  }

  getCooldownTimeLeft(key) {
    const expires = this.getCooldown(key);
    const diff = expires.getTime() - Date.now();
    if (diff <= 0) return { min: 0, seg: 0, ms: 0 };
    return {
      min: Math.floor(diff / 60000),
      seg: Math.floor((diff % 60000) / 1000),
      ms: diff
    };
  }
}

export default User;
