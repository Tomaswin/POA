const { readFileSync } = require('fs')
const typeDefs = readFileSync('./schema.graphql').toString('utf-8')

const { ApolloServer } = require('apollo-server');

const admin = require("firebase-admin")
const FbFunctions = require("firebase-functions");
const { UserDimensions } = require('firebase-functions/lib/providers/analytics');
const firebaseConfig = require('./firebaseConfig.json')

admin.initializeApp({
    credential: admin.credential.cert(firebaseConfig)
});

const resolvers = {
    Query: {
        users: async () => {
            let users = [];
            try {
                await admin.firestore().collection("users").get().then(function (querySnapchshot) {
                    console.log(querySnapchshot)
                    querySnapchshot.forEach(function (doc) {
                        users.push(doc.data());
                    });
                })
            } catch (error) {
                console.log("no funca")
            }
            return users
        },
    },
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`);
});


// TYPE DATE = SCALAR 
/* 
// resolver for DATE
// https://stackoverflow.com/questions/49693928/date-and-json-in-type-definition-for-graphql 
const resolverMap = {
    Date: new GraphQLScalarType({
      name: 'Date',
      description: 'Date custom scalar type',
      parseValue(value) {
        return new Date(value); // value from the client
      },
      serialize(value) {
        return value.getTime(); // value sent to the client
      },
      parseLiteral(ast) {
        if (ast.kind === Kind.INT) {
          return parseInt(ast.value, 10); // ast value is always in string format
        }
        return null;
      },
    })
} 
*/