// src/comandos/mod/reset.js
import User from "../../database/models/User.js";
import { userTarget } from "../../utils/userTarget.js";
import { aviso } from "../../utils/format.js";

export const name      = "reset";
export const aliases   = ["limpiar", "borrardatos"];
export const onlyAdmin = false;
export const onlyMod   = true;
export const onlyOwner = false;

export const run = async (contexto) => {
  const { from, args, reply, react } = contexto;

  if (args.length === 0) {
    return reply(aviso("Uso:\n_!reset advs @user_\n_!reset notas @user_"));
  }

  const tipo = args[0].toLowerCase();
  const esAdvs  = tipo.startsWith("adv");
  const esNotas = tipo.startsWith("nota");

  if (!esAdvs && !esNotas) {
    return reply(aviso("Debes especificar qué resetear: *advs* o *notas*.\nEjemplo: _!reset advs @user_"));
  }

  // Obtener objetivo (ignorando el primer argumento que es el tipo)
  const contextoParaTarget = { ...contexto, args: args.slice(1) };
  const targetJid = await userTarget(contextoParaTarget, User);

  if (!targetJid) {
    return reply(aviso("No se pudo encontrar al usuario objetivo."));
  }

  try {
    const update = esAdvs ? { advs: [] } : { notas: [] };
    const result = await User.findOneAndUpdate(
      { jid: targetJid },
      { $set: update },
      { new: true }
    );

    if (!result) {
      return reply(aviso("El usuario no tiene un perfil registrado."));
    }

    await react("✅");
    const label = esAdvs ? "advertencias" : "notas";
    const nombre = result?.personaje || targetJid.split("@")[0];
    return reply(aviso(`Se han reseteado todas las *${label}* de *${nombre}*.`));

  } catch (error) {
    console.error("Error en !reset:", error);
    await react("❌");
    return reply(aviso("Ocurrió un error al intentar resetear los datos."));
  }
};
