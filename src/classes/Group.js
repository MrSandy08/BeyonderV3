// src/classes/Group.js
import ConfigSchema from "../database/models/Config.js";
import CommunityStateSchema from "../database/models/CommunityState.js";

/**
 * Beyonder v4: Group & Community Class
 * Gestiona configuraciones, estados de tensión y lógica de comunidad.
 */
class Group {
  constructor(config, state) {
    this.config = config; // Datos de ConfigSchema (lean)
    this.state = state;   // Datos de CommunityStateSchema (lean)
    this.groupId = config.groupId;
    this.communityId = config.communityId || config.groupId;
  }

  /**
   * Obtiene o crea la configuración y estado de un grupo.
   */
  static async get(groupId) {
    let config = await ConfigSchema.findOne({ groupId }).lean();
    if (!config) {
      config = await ConfigSchema.findOneAndUpdate(
        { groupId },
        { $setOnInsert: { groupId, communityId: groupId, esPrincipal: true } },
        { upsert: true, new: true, lean: true }
      );
    }

    const communityId = config.communityId || groupId;
    let state = await CommunityStateSchema.findOne({ communityId }).lean();
    if (!state) {
      state = await CommunityStateSchema.findOneAndUpdate(
        { communityId },
        { $setOnInsert: { communityId, tension: 0, globalEnergy: 100 } },
        { upsert: true, new: true, lean: true }
      );
    }

    return new Group(config, state);
  }

  // ── Métodos de Configuración ───────────────────────────────────────────────

  async updateConfig(update) {
    return await ConfigSchema.updateOne({ groupId: this.groupId }, update);
  }

  isPrincipal() {
    return this.config.esPrincipal ?? true;
  }

  // ── Métodos de Estado de Comunidad ─────────────────────────────────────────

  async addTension(amount) {
    this.state.tension = Math.min(100, (this.state.tension || 0) + amount);
    return await CommunityStateSchema.updateOne(
      { communityId: this.communityId },
      { $inc: { tension: amount } }
    );
  }

  async reduceEnergy(amount) {
    this.state.globalEnergy = Math.max(0, (this.state.globalEnergy || 100) - amount);
    return await CommunityStateSchema.updateOne(
      { communityId: this.communityId },
      { $inc: { globalEnergy: -amount } }
    );
  }

  getTension() {
    return this.state.tension || 0;
  }

  getEnergy() {
    return this.state.globalEnergy || 100;
  }
}

export default Group;
