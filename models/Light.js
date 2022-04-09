const { model, Schema } = require("mongoose");

const lightSchema = new Schema({
  name: String,
  mode: String,
});

module.exports = model("Light", lightSchema);
