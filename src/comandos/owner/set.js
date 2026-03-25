// src/comandos/owner/set.js
import Config from "../../database/models/Config.js";
import { aviso } from "../../utils/format.js";

export const name      = "set";
export const aliases   = [];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = true;

export const run = async (contexto) => {
  const { reply, react, from, args } = contexto;

  const tipo = args[0]?.toLowerCase();
  if (!tipo || !["principal", "secundaria"].includes(tipo))
    return reply(aviso("Uso: _!set principal_ o _!set secundaria_"));

  const esPrincipal  = tipo === "principal";
  const esSecundaria = tipo === "secundaria";

  if (esPrincipal)  await Config.updateMany({}, { $set: { esPrincipal: false } });
  if (esSecundaria) await Config.updateMany({}, { $set: { esSecundaria: false } });

  await Config.findOneAndUpdate({ groupId: from }, { $set: { esPrincipal, esSecundaria } }, { upsert: true });
  await react("✅");
  await reply(
    esPrincipal
      ? aviso("Este grupo es ahora el *Principal*. 🏠\n       𝄄   _Aquí se anunciarán entradas, salidas y logs._")
      : aviso("Este grupo es ahora el *Secundario*. 🔁\n       𝄄   _Recibirá listas y mensajes de respaldo._")
  );
};
