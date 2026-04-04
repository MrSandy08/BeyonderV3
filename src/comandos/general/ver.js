
import User from "../../database/models/User.js";
import { run as runAdv } from "../mod/adv.js";
import { run as runExcusa } from "./excusa.js";

export const name      = "ver";
export const aliases   = ["v"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

export const run = async (contexto) => {
  const { args } = contexto;
  const sub = args[0]?.toLowerCase();

  // Clonamos el contexto para no afectar el original y quitamos el subcomando de args
  const nuevoContexto = { ...contexto, args: args.slice(1) };

  if (sub === "adv" || sub === "advs" || sub === "warn") {
    return runAdv(nuevoContexto);
  }

  if (sub === "excusa" || sub === "excusas") {
    return runExcusa(nuevoContexto);
  }

  return contexto.reply("⚠️ Uso: _!ver adv_ o _!ver excusa_");
};
