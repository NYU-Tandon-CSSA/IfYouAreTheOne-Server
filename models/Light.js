const { model, Schema } = require("mongoose");

const lightSchema = new Schema({
  name: String,
  mode: String,
  realname: String,
});

module.exports = model("Light", lightSchema);
