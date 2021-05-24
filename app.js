const { GraphQLServer } = require('graphql-yoga')
const admin = require("firebase-admin")
const FbFunctions = require("firebase-functions")
const firebaseConfig = require("../POA/firebaseConfig.json")

admin.initializeApp({
    credential: admin.credential.cert(firebaseConfig)
});

/*
const http = require("http")
const port = 3000
const server = http.createServer(function (req, res) {
    res.write("hola")
    res.end()
})

server.listen(port, function (error) {
    if (error) {
        console.log(error)
    } else {
        console.log(port)
    }
})*/


let authors = []
let books = []
let categories = [{
    id: 1,
    description: "Horror"
}]


let idCount = categories.length

const resolvers = {
    Query: {
        categories: () => categories
        //feed: () => links,
        //test: () => 'Que falla?'
    },

    Mutation: {
        // 2
        createCategory: (parent, args) => {
            const category = {
                id: idCount++,
                description: args.description,
            }
            categories.push(category)
            return category
        }
    },

}

const server = new GraphQLServer({

    typeDefs: './schema.graphql',
    resolvers,
})
server.start(() => console.log('Server is running on http://localhost:3000'))