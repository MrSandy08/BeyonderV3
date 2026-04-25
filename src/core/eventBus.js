class EventBus { 
  constructor() { 
    this.events = {}; 
  } 
 
  on(event, listener) { 
    if (!this.events[event]) this.events[event] = []; 
    this.events[event].push(listener); 
  } 
 
  async emit(event, data) { 
    const listeners = this.events[event] || []; 
    for (const fn of listeners) { 
      try { 
        await fn(data); 
      } catch (err) { 
        console.error(`[EventBus] Error en "${event}":`, err); 
      } 
    } 
  } 
} 
 
export default new EventBus(); 
