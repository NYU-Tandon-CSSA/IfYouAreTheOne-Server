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
      name: String!
      mode: String!
    }
    type Pick {
      name: String!
      pick: String!
      show: Boolean!
    }
    type Query {
      getLights: [Light]
      getPicks: [Pick]
    }
    type Mutation {
      updateLight(name: String!, mode: String!): Light!
      updatePick(name: String!, pick: String!): Pick!
      showPick(name: String!, show: Boolean!): Pick!
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
          { name: args.name },
          { mode: args.mode },
          { new: true }
        );

        const lights = await Light.find();
        pubsub.publish("LIGHT_UPDATED", {
          lightUpdated: lights,
        });
        return res;
      },

      async updatePick(parent, args, context, info) {
        const res = await Pick.findOneAndUpdate(
          { name: args.name },
          { pick: args.pick },
          { new: true }
        );

        const picks = await Pick.find();
        pubsub.publish("PICK_UPDATED", {
          pickUpdated: picks,
        });
        return res;
      },

      async showPick(parent, args, context, info) {
        const res = await Pick.findOneAndUpdate(
          { name: args.name },
          { show: args.show },
          { new: true }
        );

        const picks = await Pick.find();
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
  });

  await server.start();
  server.applyMiddleware({ app });

  mongoose.connect(MONGODB, { useNewUrlParser: true });

  const PORT = process.env.PORT || 7789;
  httpServer.listen(PORT, () =>
    console.log("Server is now running on port " + PORT)
  );
})();
