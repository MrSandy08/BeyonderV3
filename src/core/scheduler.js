import eventBus from "./eventBus.js"; 
import UserClass from "../classes/User.js";
 
export const startScheduler = () => { 
  setInterval(async () => { 
    await eventBus.emit("tick_5min"); 
    // Sincronización masiva de caché a DB
    await UserClass.syncAllToDB();
  }, 5 * 60 * 1000); 
 
  setInterval(() => { 
    eventBus.emit("tick_1min"); 
  }, 60 * 1000); 
}; 
