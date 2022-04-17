const { model, Schema } = require("mongoose");

const pickSchema = new Schema({
  name: String,
  pick: String,
  show: Boolean,
});

module.exports = model("Pick", pickSchema);
