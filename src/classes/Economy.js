// src/classes/Economy.js
import UserSchema from "../database/models/User.js";

/**
 * Beyonder v4: Economy Service Class
 * Centraliza las transacciones financieras para evitar errores en comandos de economía.
 */
class Economy {
  /**
   * Transfiere dinero de un usuario a otro dentro de la misma comunidad.
   */
  static async transfer(senderJid, receiverJid, communityId, amount) {
    if (amount <= 0) throw new Error("Monto no válido.");

    const sender = await UserSchema.findOne({ jid: senderJid, communityId });
    if (!sender || sender.money < amount) throw new Error("No tienes suficiente dinero.");

    const receiver = await UserSchema.findOne({ jid: receiverJid, communityId });
    if (!receiver) throw new Error("El destinatario no existe.");

    // Transacción atómica (simulada sin sesiones de MongoDB por compatibilidad)
    await UserSchema.updateOne({ jid: senderJid, communityId }, { $inc: { money: -amount } });
    await UserSchema.updateOne({ jid: receiverJid, communityId }, { $inc: { money: amount } });

    return {
      senderNewBalance: sender.money - amount,
      receiverNewBalance: receiver.money + amount
    };
  }

  /**
   * Deposita dinero de la cartera al banco.
   */
  static async deposit(jid, communityId, amount) {
    const user = await UserSchema.findOne({ jid, communityId });
    if (!user || user.money < amount) throw new Error("No tienes suficiente dinero.");

    return await UserSchema.updateOne(
      { jid, communityId },
      { $inc: { money: -amount, bank: amount } }
    );
  }

  /**
   * Retira dinero del banco a la cartera.
   */
  static async withdraw(jid, communityId, amount) {
    const user = await UserSchema.findOne({ jid, communityId });
    if (!user || user.bank < amount) throw new Error("No tienes suficiente dinero en el banco.");

    return await UserSchema.updateOne(
      { jid, communityId },
      { $inc: { money: amount, bank: -amount } }
    );
  }

  /**
   * Genera una recompensa aleatoria dentro de un rango.
   */
  static generateReward(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

export default Economy;
