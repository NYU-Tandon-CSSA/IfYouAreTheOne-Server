const { ApolloServer } = require("apollo-server");
const gql = require("graphql-tag");
const mongoose = require("mongoose");

const Light = require("./models/Light");
const { MONGODB } = require("./config");

const typeDefs = gql`
  type Light {
    name: String!
    mode: String!
  }
  type Query {
    getLights: [Light]
  }
  type Mutation {
    updateLight(name: String!, mode: String!): Light!
  }
`;

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
  },
  Mutation: {
    async updateLight(parent, args, context, info) {
      return Light.findOneAndUpdate(
        { name: args.name },
        { mode: args.mode },
        { new: true }
      );
    },
  },
};

const PORT = process.env.PORT || 5000;

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

mongoose
  .connect(MONGODB, { useNewUrlParser: true })
  .then(() => {
    console.log("MongoDB Connected");
    return server.listen({ port: PORT });
  })
  .then((res) => {
    console.log(`Server running at ${res.url}`);
  })
  .catch((err) => {
    console.error(err);
  });

server.listen({ port: 5000 }).then((res) => {
  console.log(`Server running at ${res.url}`);
});
