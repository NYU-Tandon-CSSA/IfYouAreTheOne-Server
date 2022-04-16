const { model, Schema } = require("mongoose");

const pickSchema = new Schema({
  name: String,
  pick: String,
});

module.exports = model("Pick", pickSchema);
