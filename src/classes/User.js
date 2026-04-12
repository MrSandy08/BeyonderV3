// src/classes/User.js
import UserSchema from "../database/models/User.js";
import AffinitySchema from "../database/models/Affinity.js";
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
    const [userData, affData] = await Promise.all([
      UserSchema.findOne({ jid, communityId }).lean(),
      AffinitySchema.findOne({ jid, communityId }).lean()
    ]);

    if (!userData) return null;

    const data = { ...userData, affinity: affData || { points: 0, interactions: 0 } };
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
      const [userData, affData] = await Promise.all([
        UserSchema.findOneAndUpdate(
          { jid, communityId },
          { $setOnInsert: extraData },
          { upsert: true, new: true, lean: true }
        ),
        AffinitySchema.findOneAndUpdate(
          { jid, communityId },
          { $setOnInsert: { points: 0, interactions: 0 } },
          { upsert: true, new: true, lean: true }
        )
      ]);
      const data = { ...userData, affinity: affData };
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
           
           // Separar datos de afinidad para no ensuciar la colección de usuarios
           const { affinity, ...userData } = data;

           // 1. Sincronizar Usuario
           await UserSchema.replaceOne(
             { jid: data.jid, communityId: data.communityId },
             userData,
             { upsert: true }
           );

           // 2. Sincronizar Afinidad (si existe en el caché)
           if (affinity) {
             await AffinitySchema.replaceOne(
               { jid: data.jid, communityId: data.communityId },
               { jid: data.jid, communityId: data.communityId, ...affinity },
               { upsert: true }
             );
           }

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

  // ── Métodos de Afinidad ────────────────────────────────────────────────────

  async addAffinity(points) {
    if (!this.data.affinity) this.data.affinity = { points: 0, interactions: 0 };
    this.data.affinity.points = Math.min(100, Math.max(-100, (this.data.affinity.points || 0) + points));
    this.data.affinity.interactions = (this.data.affinity.interactions || 0) + 1;
    this.data.affinity.lastInteraction = new Date();
    
    this.markDirty();
    await this.saveToCache();
    
    // Sincronización inmediata para afinidad (opcional, pero recomendada por el usuario)
    return await AffinitySchema.updateOne(
      { jid: this.jid, communityId: this.communityId },
      { 
        $set: { 
          points: this.data.affinity.points,
          interactions: this.data.affinity.interactions,
          lastInteraction: this.data.affinity.lastInteraction
        } 
      },
      { upsert: true }
    );
  }

  // ── Métodos de Mensajes ─────────────────────────────────────────

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
