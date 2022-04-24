# IfYouAreTheOne-Server

使用前请先在mongodb上新建Cluster, 然后添加lights和picks的collections,具体的schema可以直接在code里看

然后还要在根目录下添加config.js文件并输入你mongodb的链接

```
module.exports = {
  MONGODB:
    "mongodb+srv://你的mongodb连接",
};
```
