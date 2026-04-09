import { BufferJSON, initAuthCreds, proto } from "@whiskeysockets/baileys";

/**
 * Implementación manual de persistencia de estado de Baileys en MongoDB.
 * Soluciona el error de tipos de datos (Object vs Buffer) al serializar/deserializar.
 * 
 * @param {import('mongodb').Collection} collection - Colección de MongoDB para guardar el estado.
 */
export const useMongoDBAuthState = async (collection) => {
  
  /**
   * Escribe datos en la colección, convirtiendo Buffers a formato JSON seguro.
   */
  const writeData = async (data, id) => {
    try {
      const jsonStr = JSON.stringify(data, BufferJSON.replacer);
      await collection.replaceOne(
        { _id: id },
        { _id: id, data: jsonStr },
        { upsert: true }
      );
    } catch (error) {
      console.error(`[MongoDB Auth] Error al escribir ID: ${id}`, error);
    }
  };

  /**
   * Lee datos de la colección y revive los Buffers correctamente.
   */
  const readData = async (id) => {
    try {
      const doc = await collection.findOne({ _id: id });
      if (doc && doc.data) {
        return JSON.parse(doc.data, BufferJSON.reviver);
      }
      return null;
    } catch (error) {
      console.error(`[MongoDB Auth] Error al leer ID: ${id}`, error);
      return null;
    }
  };

  /**
   * Elimina datos de la colección.
   */
  const removeData = async (id) => {
    try {
      await collection.deleteOne({ _id: id });
    } catch (error) {
      console.error(`[MongoDB Auth] Error al eliminar ID: ${id}`, error);
    }
  };

  // 1. Cargar o inicializar credenciales
  let creds = await readData("creds");
  if (!creds) {
    creds = initAuthCreds();
    await writeData(creds, "creds");
  }

  const state = {
    creds,
    keys: {
      get: async (type, ids) => {
        const data = {};
        await Promise.all(
          ids.map(async (id) => {
            let value = await readData(`${type}-${id}`);
            if (type === "app-state-sync-key" && value) {
              value = proto.Message.AppStateSyncKeyData.fromObject(value);
            }
            data[id] = value;
          })
        );
        return data;
      },
      set: async (data) => {
        const tasks = [];
        for (const category in data) {
          for (const id in data[category]) {
            const value = data[category][id];
            const key = `${category}-${id}`;
            if (value) {
              tasks.push(writeData(value, key));
            } else {
              tasks.push(removeData(key));
            }
          }
        }
        await Promise.all(tasks);
      },
    },
  };

  return {
    state,
    saveCreds: async () => {
      await writeData(state.creds, "creds");
    },
  };
};

export default useMongoDBAuthState;
