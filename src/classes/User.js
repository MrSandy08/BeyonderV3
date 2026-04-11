// src/classes/User.js
import UserSchema from "../database/models/User.js";
import { redisClient } from "../database/connection.js";

/**
 * Beyonder v4: User Wrapper Class with Redis Caching
 * Centraliza la lógica de negocio del usuario y optimiza el rendimiento con Redis.
 */
class User {
  constructor(data) {
    this.data = data; // Datos del modelo de Mongoose (lean object)
    this.jid = data.jid;
    this.communityId = data.communityId;
    this.cacheKey = `user:${this.communityId}:${this.jid}`;
    this.isDirty = false;
  }

  // Lista global de usuarios "sucios" para sincronización periódica
  static dirtyUsers = new Set();

  /**
   * Obtiene un usuario de la DB o Caché y lo envuelve en la clase.
   */
  static async get(jid, communityId) {
    // 1. Intentar cargar desde Redis
    if (redisClient) {
      const cached = await redisClient.get(`user:${communityId}:${jid}`);
      if (cached) {
        return new User(JSON.parse(cached));
      }
    }

    // 2. Si no está en Redis, cargar de MongoDB
    const data = await UserSchema.findOne({ jid, communityId }).lean();
    if (!data) return null;

    const user = new User(data);
    await user.saveToCache();
    return user;
  }

  /**
   * Crea o actualiza un usuario (upsert) y lo devuelve envuelto.
   */
  static async findOrCreate(jid, communityId, extraData = {}) {
    let user = await User.get(jid, communityId);
    if (!user) {
      const data = await UserSchema.findOneAndUpdate(
        { jid, communityId },
        { $setOnInsert: extraData },
        { upsert: true, new: true, lean: true }
      );
      user = new User(data);
      await user.saveToCache();
    }
    return user;
  }

  /**
   * Guarda los datos actuales en el caché de Redis.
   */
  async saveToCache() {
    if (redisClient) {
      await redisClient.setEx(this.cacheKey, 3600, JSON.stringify(this.data));
    }
  }

  /**
   * Marca al usuario como "sucio" para que se sincronice con MongoDB después.
   */
  markDirty() {
    this.isDirty = true;
    User.dirtyUsers.add(this.cacheKey);
  }

  /**
    * Sincroniza todos los usuarios "sucios" de Redis a MongoDB.
    * Se recomienda llamar esto cada 5 minutos.
    */
   static async syncAllToDB() {
     if (User.dirtyUsers.size === 0) return;
     
     const total = User.dirtyUsers.size;
     console.log(`🔄 [v4] Sincronizando ${total} usuarios con MongoDB...`);
     
     const usersToSync = Array.from(User.dirtyUsers);
     User.dirtyUsers.clear(); // Limpiamos antes para capturar nuevos cambios durante el proceso

     let success = 0;
     let failed = 0;

     for (const cacheKey of usersToSync) {
       try {
         const cached = await redisClient.get(cacheKey);
         if (cached) {
           const data = JSON.parse(cached);
           // Usamos replaceOne para asegurar que el documento en Mongo sea EXACTAMENTE igual al de Redis
           await UserSchema.replaceOne(
             { jid: data.jid, communityId: data.communityId },
             data,
             { upsert: true }
           );
           success++;
         }
       } catch (e) {
         failed++;
         console.error(`❌ [v4] Error sincronizando ${cacheKey}:`, e.message);
         // Si falla, lo devolvemos a la lista para el próximo intento
         User.dirtyUsers.add(cacheKey);
       }
     }
     
     console.log(`✅ [v4] Sincronización completada: ${success} éxitos, ${failed} fallos.`);
   }

  // ── Métodos de Economía ────────────────────────────────────────────────────

  async addMoney(amount) {
    this.data.money = (this.data.money || 0) + amount;
    this.markDirty();
    await this.saveToCache();
    
    // Sincronización inmediata para economía crítica (opcional)
    return await UserSchema.updateOne(
      { jid: this.jid, communityId: this.communityId },
      { $inc: { money: amount } }
    );
  }

  async removeMoney(amount) {
    if ((this.data.money || 0) < amount) return false;
    this.data.money -= amount;
    this.markDirty();
    await this.saveToCache();
    
    return await UserSchema.updateOne(
      { jid: this.jid, communityId: this.communityId },
      { $inc: { money: -amount } }
    );
  }

  // ── Métodos de Mensajes y Afinidad ─────────────────────────────────────────

  async incrementMsgCount() {
    this.data.msgCount = (this.data.msgCount || 0) + 1;
    this.data.lastMessage = new Date();
    this.markDirty();
    await this.saveToCache();
    
    // Aquí podríamos NO hacer update en Mongo de inmediato para ahorrar recursos
    // y dejar que el sync periódico lo haga cada 5 min.
  }

  // ── Métodos de Permisos ────────────────────────────────────────────────────

  isOwner(ownerList = []) {
    return ownerList.includes(this.jid) || this.data.permisos === 3;
  }

  isMod() {
    return (this.data.permisos || 0) >= 2;
  }

  isHelper() {
    return (this.data.permisos || 0) >= 1;
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
    return this.data.cooldowns?.[key] ? new Date(this.data.cooldowns[key]) : new Date(0);
  }

  async setCooldown(key, durationMs) {
    const expires = new Date(Date.now() + durationMs);
    if (!this.data.cooldowns) this.data.cooldowns = {};
    this.data.cooldowns[key] = expires;
    
    await this.saveToCache();
    
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
