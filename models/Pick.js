const { model, Schema } = require("mongoose");

const pickSchema = new Schema({
  user: String,
  userid: Number,
  show: Boolean,
});

module.exports = model("Pick", pickSchema);

/*
user:   默认为user
userid: 爆灯中间的编号
show:   显示隐藏爆灯开关
*/
