// src/comandos/eco/fish.js
import User from "../../database/models/User.js";

export const name      = "fish";
export const aliases   = ["pescar"];
export const onlyAdmin = false;
export const onlyMod   = false;
export const onlyOwner = false;

const COOLDOWN = 5 * 60 * 1000; // 5 minutos

const WEIGHTS = [
  { item: "common",    weight: 5000, price: 10,  rarity: "⭐ (Común)",  fish_weight: 1.5 },
  { item: "puffer",    weight: 3000, price: 30,  rarity: "⭐ (Común)",  fish_weight: 0.8 },
  { item: "salmon",    weight: 1500, price: 75,  rarity: "⭐⭐ (Raro)", fish_weight: 3.2 },
  { item: "eel",       weight: 498,  price: 200, rarity: "✨ (Épico)",   fish_weight: 5.0 },
  { item: "leviathan", weight: 1,    price: 5000,rarity: "💎 (Leyenda)", fish_weight: 150.0 },
  { item: "kraken",    weight: 1,    price: 8000,rarity: "🐙 (Mítico)",  fish_weight: 300.0 },
];

export const run = async (contexto) => {
  const { reply, sender, from } = contexto;

  const user = await User.findOne({ jid: sender, groupId: from }).select("lastFish").lean();
  const now  = Date.now();

  if (user && user.lastFish && (now - user.lastFish) < COOLDOWN) {
    const remaining = Math.ceil((COOLDOWN - (now - user.lastFish)) / 1000);
    return reply(`⏳ Debes esperar ${remaining} segundos para volver a pescar.`);
  }

  const randomFish = Math.random();
  
  // 60% de probabilidad de encuentro Pokémon
  if (randomFish < 0.60) {
    // Generar un ID aleatorio de un Pokémon tipo agua (usando IDs conocidos o filtrando)
    // Para simplificar, elegiremos un ID aleatorio entre 1 y 151 y verificaremos si es agua
    const { getPokemonData, renderPokemonCard } = await import("../../services/pokemonService.js");
    
    let wildPokeData = null;
    let attempts = 0;
    while (!wildPokeData && attempts < 20) {
      const randomId = Math.floor(Math.random() * 151) + 1;
      const data = await getPokemonData(randomId);
      if (data && data.types.includes("water")) {
        wildPokeData = data;
      }
      attempts++;
    }

    if (!wildPokeData) wildPokeData = await getPokemonData(129); // Magikarp por defecto

    await User.findOneAndUpdate({ jid: sender, groupId: from }, { $set: { lastFish: now } });

    // Obtener el Pokémon principal del usuario
    const UserPokemon = (await import("../../database/models/UserPokemon.js")).default;
    let playerPoke = await UserPokemon.findOne({ owner: sender, groupId: from, isFavorite: true });
    if (!playerPoke) playerPoke = await UserPokemon.findOne({ owner: sender, groupId: from });

    // Crear combate en MongoDB
    const Combat = (await import("../../database/models/Combat.js")).default;
    const combat = await Combat.create({
      jid:             sender,
      groupId:         from,
      playerPokemonId: playerPoke._id,
      playerHP:        playerPoke.hp_current,
      enemy: {
        pokeID:     wildPokeData.id,
        name:       wildPokeData.name,
        level:      Math.floor(Math.random() * 5) + 5,
        hp_current: wildPokeData.stats.hp,
        hp_max:     wildPokeData.stats.hp,
        atk:        wildPokeData.stats.atk,
        def:        wildPokeData.stats.def,
        spd:        wildPokeData.stats.spd,
        types:      wildPokeData.types,
      }
    });

    const buffer = await renderBattleScene(playerPoke, combat.enemy, combat.playerHP, combat.enemy.hp_current);

    let txt = `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n`;
    txt += `🎣 ¡ALGO PICA EN EL ANZUELO!\n`;
    txt += `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n`;
    txt += `🌊 ¡Un *${wildPokeData.name.toUpperCase()}* salvaje ha aparecido!\n`;
    txt += `💥 *COMBATE DE TEXTO* 💥\n\n`;
    txt += `¡El ${wildPokeData.name} salta del agua y te desafía!\n`;
    txt += `⚔️ Usa *!atacar* para luchar.\n`;
    txt += `🔴 Usa *!atrapar* para intentar capturarlo.\n`;
    
    return await contexto.sock.sendMessage(from, { image: buffer, caption: txt }, { quoted: contexto.msg });
  }

  // 40% encontrar basura/objetos
  const goldGain = Math.floor(Math.random() * 50) + 10;
  
  // Actualización atómica
  await User.findOneAndUpdate(
    { jid: sender, groupId: from },
    { 
      $inc: { gold: goldGain },
      $set: { lastFish: now }
    },
    { upsert: true }
  );

  let txt = `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n`;
  txt += `🎣 ¡ALGO PICA EN EL ANZUELO!\n`;
  txt += `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n`;
  txt += `👞 Solo has pescado... ¡Basura!\n`;
  txt += `💰 Pero la vendes por \`${goldGain} Oro\`. 🪙\n`;
  txt += `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`;

  await reply(txt);
};
