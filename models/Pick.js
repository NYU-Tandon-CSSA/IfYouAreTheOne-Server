const { model, Schema } = require("mongoose");

const pickSchema = new Schema({
  user: String,
  userid: Number,
  show: Boolean,
});

module.exports = model("Pick", pickSchema);

/*
user:   没用，默认user，原名叫name
userid: 爆灯中间的编号，原名叫pick
show:   显示隐藏爆灯开关
*/
