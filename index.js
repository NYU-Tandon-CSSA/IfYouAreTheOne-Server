const express = require("express");
const { createServer } = require("http");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const { SubscriptionServer } = require("subscriptions-transport-ws");
const { execute, subscribe } = require("graphql");
const { ApolloServer } = require("apollo-server-express");
const mongoose = require("mongoose");
const gql = require("graphql-tag");
const { PubSub } = require("graphql-subscriptions");

const Light = require("./models/Light");
const Pick = require("./models/Pick");
const { MONGODB } = require("./config");

(async function () {
  const app = express();
  const httpServer = createServer(app);

  const typeDefs = gql`
    type Light {
      userid: Int!
      name: String!
      mode: String!
    }
    type Pick {
      user: String!
      userid: Int!
      show: Boolean!
    }
    type Query {
      getLights: [Light]
      getPicks: [Pick]
    }
    type Mutation {
      updateLight(userid: Int!, name: String!, mode: String!): Light!
      updatePick(user: String!, userid: Int!): Pick!
      showPick(user: String!, show: Boolean!): Pick!
    }
    type Subscription {
      lightUpdated: [Light]
      pickUpdated: [Pick]
    }
  `;

  const pubsub = new PubSub();
  const resolvers = {
    Query: {
      async getLights() {
        try {
          const lights = await Light.find();
          return lights;
        } catch (err) {
          throw new Error(err);
        }
      },

      async getPicks() {
        try {
          const picks = await Pick.find();
          return picks;
        } catch (err) {
          throw new Error(err);
        }
      },
    },
    Mutation: {
      async updateLight(parent, args, context, info) {
        const res = await Light.findOneAndUpdate(
          { userid: args.userid },
          { 
            name: args.name,
            mode: args.mode 
          },
          { 
            new: true,
            upsert: true  // 如果记录不存在则创建新记录
          }
        );

        const lights = await Light.find();
        pubsub.publish("LIGHT_UPDATED", {
          lightUpdated: lights,
        });
        return res;
      },

      async updatePick(parent, args, context, info) {
        // 直接创建新记录，不检查是否已存在
        const res = await Pick.create({
          user: args.user,
          userid: args.userid,
          show: false,
          createdAt: new Date()  // 添加时间戳以便排序
        });

        const picks = await Pick.find().sort({ createdAt: -1 });  // 按创建时间倒序排序
        pubsub.publish("PICK_UPDATED", {
          pickUpdated: picks,
        });
        return res;
      },

      async showPick(parent, args, context, info) {
        // 先找到最新的记录
        const latestPick = await Pick.findOne().sort({ createdAt: -1 });
        
        // 更新最新记录的 show 状态
        const res = await Pick.findOneAndUpdate(
          { _id: latestPick._id },  // 使用记录的 _id 来确保更新的是最新记录
          { 
            show: args.show
          },
          { 
            new: true
          }
        );

        const picks = await Pick.find().sort({ createdAt: -1 });  // 按创建时间倒序排序
        pubsub.publish("PICK_UPDATED", {
          pickUpdated: picks,
        });
        return res;
      },
    },
    Subscription: {
      lightUpdated: {
        subscribe: () => pubsub.asyncIterator("LIGHT_UPDATED"),
      },
      pickUpdated: {
        subscribe: () => pubsub.asyncIterator("PICK_UPDATED"),
      },
    },
  };

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  const subscriptionServer = SubscriptionServer.create(
    {
      schema,
      execute,
      subscribe,
    },
    { server: httpServer, path: "/graphql" }
  );

  const server = new ApolloServer({
    schema,
    plugins: [
      {
        async serverWillStart() {
          return {
            async drainServer() {
              subscriptionServer.close();
            },
          };
        },
      },
    ],
    playground: true,
    introspection: true,
  });

  await server.start();
  server.applyMiddleware({ app });

  mongoose.connect(MONGODB, { useNewUrlParser: true });

  const PORT = process.env.PORT || 7789;
  httpServer.listen(PORT, () =>
    console.log("Server is now running on port " + PORT)
  );
})();
