// src/comandos/mod/quitar.js
// !quitar nota #N @user | !quitar adv #N @user
import User from "../../database/models/User.js";
import Suggestion from "../../database/models/Suggestion.js";
import { aviso } from "../../utils/format.js";
import userTarget from "../../utils/userTarget.js";

export const name      = "quitar";
export const aliases   = [];
export const onlyAdmin = false;
export const onlyMod   = true;
export const onlyOwner = false;

const numFromJid = (jid) => jid?.split("@")[0] || jid;

export const run = async (contexto) => {
  const { reply, react, args, msg, from } = contexto;

  const rawBody = (
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text || ""
  ).trim().toLowerCase();

  // Determinar qué se quiere quitar: nota, adv o suge
  const tipo = args[0]?.toLowerCase(); // "nota", "adv" o "suge"
  if (tipo !== "nota" && tipo !== "adv" && tipo !== "suge") {
    return reply(
      aviso(
        "Uso correcto:\n" +
        "       𝄄   _!quitar nota #N @user_ — elimina la nota número N\n" +
        "       𝄄   _!quitar adv #N @user_ — elimina la advertencia número N\n" +
        "       𝄄   _!quitar suge #N_ — elimina la sugerencia número N"
      )
    );
  }

  // Extraer número (#N o N)
  const numStr = args[1]?.replace("#", "");
  const n      = parseInt(numStr);
  if (isNaN(n) || n < 1) {
    return reply(aviso(`Indica el número de ${tipo}.\n       𝄄   _Ej: !quitar ${tipo} #2_`));
  }

  if (tipo === "suge") {
    const lista = await Suggestion.find({}).sort({ timestamp: -1 });
    if (!lista.length) return reply(aviso("No hay sugerencias registradas."));
    if (n > lista.length) return reply(aviso(`Solo hay *${lista.length}* sugerencia(s). El número máximo es #${lista.length}.`));

    const idToDelete = lista[n - 1]._id;
    await Suggestion.findByIdAndDelete(idToDelete);
    await react("✅");
    return reply(aviso(`Sugerencia *#${n}* eliminada correctamente.`));
  }

  // Detectar objetivo (ignorando el tipo y el número)
  const argsTarget = args.slice(2);
  const objetivo = await userTarget({ ...contexto, args: argsTarget }, User);
  
  if (!objetivo) return reply(aviso(`Menciona al usuario o escribe su personaje con el *!quitar ${tipo}*.`));

  const u = await User.findOne({ jid: objetivo, groupId: from }).lean();
  if (!u) return reply(aviso(`@${numFromJid(objetivo)} no tiene datos registrados en este grupo.`), [objetivo]);

  if (tipo === "nota") {
    const notas = u.notas || [];
    if (!notas.length)   return reply(aviso(`@${numFromJid(objetivo)} no tiene notas en este grupo.`), [objetivo]);
    if (n > notas.length) return reply(aviso(`Solo hay *${notas.length}* nota(s). El número máximo es #${notas.length}.`));

    // Clonar array, eliminar el índice y guardar
    const nuevas = [...notas];
    const [eliminada] = nuevas.splice(n - 1, 1);

    await User.findOneAndUpdate({ jid: objetivo, groupId: from }, { $set: { notas: nuevas } });
    await react("✅");
    return reply(
      aviso(`Nota *#${n}* eliminada de @${numFromJid(objetivo)}.\n       𝄄   _"${eliminada.contenido}"_`),
      [objetivo]
    );
  }

  if (tipo === "adv") {
    const advs = u.advs || [];
    if (!advs.length)   return reply(aviso(`@${numFromJid(objetivo)} no tiene advertencias en este grupo.`), [objetivo]);
    if (n > advs.length) return reply(aviso(`Solo hay *${advs.length}* advertencia(s). El número máximo es #${advs.length}.`));

    const nuevas = [...advs];
    const [eliminada] = nuevas.splice(n - 1, 1);

    await User.findOneAndUpdate({ jid: objetivo, groupId: from }, { $set: { advs: nuevas } });
    await react("✅");
    return reply(
      aviso(`Advertencia *#${n}* eliminada de @${numFromJid(objetivo)}.\n       𝄄   _"${eliminada.contenido}"_\n       𝄄   📊 Advs restantes: *${nuevas.length}/3*`),
      [objetivo]
    );
  }
};
