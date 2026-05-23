import { Schema, model } from "mongoose";

const PedidoSchema = new Schema({
  user: String,
  personaje: String,
  fandom: String,
  fecha: { type: Date, default: Date.now }
});

const Pedido = model("Pedido", PedidoSchema);
export default Pedido;