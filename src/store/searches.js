
// src/store/searches.js
// Almacena temporalmente los resultados de búsqueda interactiva (como !play)
export const searches = new Map();

// Formato de la llave: groupId + senderId
// Formato del valor: { results: Array, type: "audio"|"video", timer: Number }
