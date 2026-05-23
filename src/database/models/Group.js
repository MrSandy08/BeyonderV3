import { Schema, model } from "mongoose";

const GroupSchema = new Schema({
  _id: String,
  name: String
});

const Group = model("Group", GroupSchema);
export default Group;