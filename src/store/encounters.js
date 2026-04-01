// src/store/encounters.js
// Almacena temporalmente los encuentros salvajes de Pokémon
export const encounters = new Map();

// Formato de la llave: groupId + senderId
// Formato del valor: { pokemon: Object, timestamp: Number }
