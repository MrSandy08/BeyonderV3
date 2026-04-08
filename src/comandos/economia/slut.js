// src/comandos/economia/slut.js
import User from "../../database/models/User.js";
import { aviso } from "../../utils/format.js";

export const name      = "slut";
export const aliases   = ["puta", "prostituto"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

const MS_EN_MIN  = 60 * 1000;

export const run = async (contexto) => {
  const { reply, sender, communityId } = contexto;

  const user = await User.findOne({ jid: sender, communityId });
  if (!user) return;

  const ahora = new Date();
  if (user.cooldowns?.slut && user.cooldowns.slut > ahora) {
    const restante = user.cooldowns.slut - ahora;
    const min = Math.floor(restante / MS_EN_MIN);
    const seg = Math.floor((restante % MS_EN_MIN) / 1000);
    return reply(aviso(`Aún no te has recuperado de tu último encuentro.\n       𝄄   _Tiempo restante: ${min}m ${seg}s_`));
  }

  const exito = Math.random() > 0.30; // 70% éxito (antes 60%)
  if (exito) {
    const ganancia = Math.floor(Math.random() * (1200 - 600 + 1)) + 600;
    user.money += ganancia;
    user.cooldowns.slut = new Date(ahora.getTime() + 3 * MS_EN_MIN); // 3 min cooldown éxito
    await user.save();
    return reply(aviso(`🍒 *SLUT EXITOSO*\n\nHas tenido un encuentro fructífero y ganaste *${ganancia}* monedas.\n       𝄄   _Tu nuevo saldo: ${user.money}_`));
  } else {
    // 30% fallo: Asaltado o Detenido
    let multa = Math.floor(Math.random() * (500 - 200 + 1)) + 200;
    
    // Seguro de Pobreza: si tiene menos de $100, la pérdida es $0
    if (user.money < 100) {
      multa = 0;
    }

    user.money = Math.max(0, user.money - multa);
    user.cooldowns.slut = new Date(ahora.getTime() + 15 * MS_EN_MIN); // 15 min cooldown fallo
    await user.save();
    
    const frases = [
      "Te han asaltado en un callejón oscuro.",
      "La policía te detuvo y te multó.",
      "Tuviste mala suerte y te robaron lo poco que tenías.",
    ];
    const frase = frases[Math.floor(Math.random() * frases.length)];
    
    const msgMulta = multa > 0 
      ? `Perdiste ${multa} monedas y el comando entró en un enfriamiento largo.`
      : `Por suerte no tenías casi nada, así que no te quitaron dinero, pero el comando entró en enfriamiento.`;

    return reply(aviso(`⚠️ *SLUT FALLIDO*\n\n${frase}\n       𝄄   _${msgMulta}_`));
  }
};
