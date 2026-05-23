import { Schema, model } from "mongoose";

const ConfigSchema = new Schema({
  _id: { type: String, default: "global" },
  antispam: {
    enabled: { type: Boolean, default: false },
    limit: { type: Number, default: 5 },
    seconds: { type: Number, default: 10 }
  },
  maxAdvertencias: { type: Number, default: 3 },
  minInactividad: { type: Number, default: 3 }
});

const Config = model("Config", ConfigSchema);
export default Config;