// src/comandos/economia/cultivar.js
import User from "../../database/models/User.js";
import { aviso } from "../../utils/format.js";

export const name      = "cultivar";
export const aliases   = ["cosechar", "plantar"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

const MS_EN_MIN = 60 * 1000;

export const run = async (contexto) => {
  const { reply, sender, args, communityId } = contexto;

  const user = await User.findOne({ jid: sender, communityId });
  if (!user) return;

  const ahora = new Date();

  // Si usa !cosechar
  if (command === "cosechar") {
    if (!user.crop) return reply(aviso("No tienes nada plantado. Usa !cultivar para empezar. 🌱"));

    if (ahora < user.crop.harvestAt) {
      const restante = Math.ceil((user.crop.harvestAt - ahora) / 1000);
      return reply(aviso(`Todavía no está listo para cosechar. Espera *${restante} segundos*. ⏳`));
    }

    // Si pasaron más de 10 min de la cosecha, se marchita
    const marchitoAt = new Date(user.crop.harvestAt.getTime() + 10 * MS_EN_MIN);
    if (ahora > marchitoAt) {
      user.crop = null;
      await user.save();
      return reply(aviso("🕸️ ¡Qué lástima! Olvidaste cosechar y tus plantas se han marchitado. 🥀"));
    }

    const ganancia = user.crop.ganancia;
    user.money += ganancia;
    user.crop = null;
    await user.save();
    return reply(aviso(`🧺 *COSECHA EXITOSA*\n\n¡Has cosechado tu siembra y ganaste *${ganancia}* monedas! 🥕🍎\n       𝄄   _Tu nuevo saldo: ${user.money}_`));
  }

  // Si usa !cultivar
  if (user.crop) return reply(aviso("Ya tienes algo plantado. Usa !cosechar cuando esté listo. 🌱"));

  const tipos = [
    { name: "Maíz 🌽", tiempo: 3 * MS_EN_MIN, ganancia: 500 },
    { name: "Trigo 🌾", tiempo: 5 * MS_EN_MIN, ganancia: 900 },
    { name: "Manzanas 🍎", tiempo: 10 * MS_EN_MIN, ganancia: 2000 },
  ];

  const planta = tipos[Math.floor(Math.random() * tipos.length)];
  
  user.crop = {
    type:      planta.name,
    plantedAt: ahora,
    harvestAt: new Date(ahora.getTime() + planta.tiempo),
    ganancia:  planta.ganancia
  };

  await user.save();
  const segundos = planta.tiempo / 1000;
  return reply(aviso(`🌱 *CULTIVO INICIADO*\n\nHas plantado *${planta.name}*.\n       𝄄   _Estará listo en: ${segundos} segundos_\n       𝄄   _Recuerda cosecharlo antes de que se marchite (tienes 10 min)._`));
};
