const { model, Schema } = require("mongoose");

const lightSchema = new Schema({
  userid: Number,
  name: String,
  mode: String,
});

module.exports = model("Light", lightSchema);

/*
userid: 女嘉宾编号，原名叫name
name:   女嘉宾名字
mode:   灯模式 on/off/blast
*/
