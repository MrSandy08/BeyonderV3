// src/comandos/mod/antinsfw.js
import Config from "../../database/models/Config.js";
import { aviso } from "../../utils/format.js";

export const name      = "antiporn";
export const aliases   = [];
export const onlyAdmin = false;
export const onlyMod   = true;
export const onlyOwner = false;

export const NSFW_DOMAINS = [
  "pornhub","xvideos","xnxx","xhamster","redtube","youporn","tube8",
  "spankbang","porntrex","eporner","txxx","tnaflix","fapster","tukif",
  "onlyfans","fansly","bongacams","chaturbate","cam4","stripchat",
  "nhentai","hentaihaven","rule34","gelbooru","e621",
];

export const run = async (contexto) => {
  const { reply, react, from, args, cfg, isOwner } = contexto;

  if (cfg?.lockAntiporn && !isOwner)
    return reply(aviso("🔒 El AntiPorn está bloqueado. Solo el Owner puede modificarlo."));

  const sub = args[0]?.toLowerCase();
  if (sub !== "on" && sub !== "off") return reply(aviso("Uso: _!antiporn on_ o _!antiporn off_"));

  const activo = sub === "on";
  await Config.findOneAndUpdate({ groupId: from }, { $set: { antiporn: activo } }, { upsert: true });
  await react(activo ? "🔞" : "✅");
  await reply(
    activo
      ? aviso("*AntiPorn activado.* 🔞\n       𝄄   _Se eliminarán links a sitios para adultos + Advertencia._")
      : aviso("*AntiPorn desactivado.* 🔓")
  );
};
