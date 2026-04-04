// src/comandos/mod/impuesto.js
import User from "../../database/models/User.js";
import { aviso } from "../../utils/format.js";

export const name      = "impuesto";
export const aliases   = ["tax", "taxes"];
export const onlyAdmin = false;
export const onlyMod   = true;
export const onlyOwner = false;

export const run = async (contexto) => {
  const { reply, args, isOwner } = contexto;

  const monto = parseInt(args[0]);
  if (!monto || isNaN(monto) || monto <= 0) {
    return reply(aviso("Escribe una cantidad válida para cobrar de impuestos.\n       𝄄   _Ej: !impuesto 100_"));
  }

  // Cobrar de la CARTERA a todos los usuarios que tengan dinero
  const result = await User.updateMany(
    { money: { $gt: 0 } },
    { $inc: { money: -monto } }
  );

  // Asegurar que nadie quede en negativo (cartera)
  await User.updateMany(
    { money: { $lt: 0 } },
    { $set: { money: 0 } }
  );

  return reply(aviso(`🏛️ *COBRO DE IMPUESTOS GLOBAL*\n\nSe han cobrado *${monto.toLocaleString()}* monedas a todos los usuarios activos.\n       𝄄   _Usuarios afectados: ${result.modifiedCount}_`));
};
