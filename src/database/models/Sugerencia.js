import { Schema, model } from "mongoose";

const SugerenciaSchema = new Schema({
  user: String,
  personaje: String,
  contenido: String,
  fecha: { type: Date, default: Date.now }
});

const Sugerencia = model("Sugerencia", SugerenciaSchema);
export default Sugerencia;