const { readFileSync } = require('fs')
const typeDefs = readFileSync('./schema.graphql').toString('utf-8')
const admin = require('firebase-admin')
const { ApolloServer, ApolloError } = require('apollo-server');
const firebaseConfig = require('./firebaseConfig.json');

admin.initializeApp({
  credential: admin.credential.cert(firebaseConfig)
});

const resolvers = {
  Query: {
    async user(_, args) {
      try {
        const user = await getUserById(args.token)
        const userExchange = await getExchangeByUser(args.token)
        return { ...user, "exchangesHistory": userExchange }
      } catch (error) {
        throw new ApolloError(error)
      }
    },
    async product(_, args) {
      try {
        const products = await getAllData("product")
        return { products }
      } catch (error) {
        throw new ApolloError(error)
      }
    },
    async exchange(_, args) {
      try {
        const exchange = await getAllData("exchange")
        return { exchange }
      } catch (error) {
        throw new ApolloError(error)
      }
    },
    async exchangeByUser(_, args) {
      try {
        const exchange = await getExchangeByUser(args.token)
        return { exchange }
      } catch (error) {
        throw new ApolloError(error)
      }
    }
  },

  Mutation: {
    createUser: async (parent, args) => {
      const data = {
        email: args.email,
        password: args.password,
        name: args.name,
        lastName: args.lastName,
        points: args.points
      }
      console.log(data)
      admin.auth().createUser({
        email: data.email,
        password: data.password,
      }).then((userCredential) => {
        setUser(data, userCredential.uid)
        return "Usuario creado correctamente"
      }).catch((error) => {
        return "Ya existe un usuario con este correo"
      })
    },
  }
};

async function getAllData(collection) {
  const listData = []
  const res = await admin.firestore().collection(collection).get()
  res.docs.forEach(item => {
    listData.push([item.data()])
  });

  return productList
}

async function getProductListByExchange(productExchangeList) {
  const productList = []
  console.log(productExchangeList)
  for (let index = 0; index < productExchangeList.length; index++) {
    const productInfo = await getProductById(productExchangeList[index])
    productList.push(productInfo.data())
  }
  return productList
}

async function getProductById(productId) {
  const productInfo = await admin.firestore().collection("product").doc(productId).get()
  return productInfo
}

async function getUserById(userId) {
  const usersDoc = await admin.firestore().collection("users").doc(userId).get();
  return usersDoc.data()
}

async function getExchangeByUser(userId) {
  const exchangeList = []
  const res = await admin.firestore().collection("exchange").where("user", "==", userId).get()
  for (let index = 0; index < res.docs.length; index++) {
    const exchangeData = res.docs[index].data()

    const productList = await getProductListByExchange(exchangeData.productList)
    exchangeList.push({ "name": exchangeData.name, "totalPoints": exchangeData.totalPoints, "productList": productList, "date": exchangeData.date })
  }
  return exchangeList
}

async function setUser(data, uid) {
  const res = await admin.firestore().collection("users").doc(uid).set(data)
  return res
}

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