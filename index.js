const { ApolloServer, gql } = require('apollo-server');
const admin = require("firebase-admin")
const FbFunctions = require("firebase-functions");
const { UserDimensions } = require('firebase-functions/lib/providers/analytics');
const firebaseConfig = require("../POA/firebaseConfig.json")

admin.initializeApp({
    credential: admin.credential.cert(firebaseConfig)
});

//TODO replace typeDefs with schema.graphql with require, reminder dont change the name
const typeDefs = gql`
type User {
  name: String
}

type Query {
  books: [User]
}
`;

const resolvers = {
    Query: {
        books: async () => {
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

// The `listen` method launches a web server.
server.listen().then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`);
});