const { readFileSync } = require('fs')
const { ApolloServer, ApolloError, addErrorLoggingToSchema } = require('apollo-server');
const admin = require('firebase/app')
require("firebase/auth");
require("firebase/firestore");
const firebaseConfig = require('./firebaseConfig.json');

const typeDefs = readFileSync('./schema.graphql').toString('utf-8')

admin.initializeApp(firebaseConfig)

const resolvers = {
  Query: {
    // req for specific User 
    async user(_, args) {
      try {
        // const user = await getUserById(args.token)
        const user = await getUserById(args.id)
        const userExchange = await getExchangeByUser(args.token)
        return { ...user, "exchangesHistory": userExchange }
      } catch (error) {
        throw new ApolloError(error)
      }
    },
    // req for all Products
    async product(_, args) {
      try {
        const products = await getAllData("product")
        console.log(products)
        return products;
      } catch (error) {
        throw new ApolloError(error)
      }
    },
    // req for all Exchanges
    async exchange(_, args) {
      try {
        const exchange = await getAllData("exchange");
        return { exchange }

        // const products = [];
        // exchange.forEach((ex) =>{
        //   const prod = await getProductListByExchange(exchange.id);
        //   products.push(prod);
        // } );
        // return {...exchange, products};
      } catch (error) {
        throw new ApolloError(error)
      }
    },
    // req for Exchanges from an specific User 
    async exchangeByUser(_, args) {
      try {
        const exchange = await getExchangeByUser(args.token);
        return exchange;
      } catch (error) {
        throw new ApolloError(error)
      }
    }
  },

  Mutation: {
    // ABM Users
    async createUser(parent, args) {
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
        return res.id //Validar si esto es lo que queremos devolver
      }).catch((error) => {
        throw new ApolloError(error)
      })
    },
    // ABM Products
    async createProduct(_, args) {
      const data = {
        name: args.name,
        description: args.description,
        availability: args.availability,
        totalPoints: args.totalPoints,
        date: Date.now()
      }

      try {
        const res = await admin.firestore().collection("product").add(data)
        return res.id
      } catch (error) {
        throw new ApolloError(error)
      }
    },
    async login(_, args) {
      admin.auth().setPersistence(admin.auth.Auth.Persistence.NONE)
        .then(() => {
          admin.auth().signInWithEmailAndPassword(args.email, args.password);
          return admin.auth().curentUser != null
        })
        .catch((error) => {
          var errorCode = error.code;
          var errorMessage = error.message;
          console.log(errorMessage)
          return false
        });
    }
  }
};

// db requests
async function getAllData(collection) {
  const listData = []
  const res = await admin.firestore().collection(collection).get()
  res.docs.forEach(item => {
    listData.push(item.data())
  });

  return listData
  // return productList
}

async function getProductListByExchange(productExchangeList) {
  const productList = []
  console.log('productExchangeList', productExchangeList)
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


// SERVER 
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