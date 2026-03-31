// src/database/models/Suggestion.js
import { Schema, model } from "mongoose";

const SuggestionSchema = new Schema(
  {
    user:      { type: String, required: true },
    text:      { type: String, required: true },
    status:    { type: String, default: "pending" },
    timestamp: { type: Date,   default: Date.now },
  },
  { versionKey: false, collection: "Suggestions" }
);

const Suggestion = model("Suggestion", SuggestionSchema);

export default Suggestion;
