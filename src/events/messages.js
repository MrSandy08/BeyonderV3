import { handleMessage } from "../core/engine.js"; 
 
export default async (sock, msg) => { 
  try { 
    await handleMessage(msg, sock); 
  } catch (err) { 
    console.error("Error en messages handler:", err); 
  } 
}; 
