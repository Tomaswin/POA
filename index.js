const { readFileSync } = require('fs')
const { ApolloServer, ApolloError } = require('apollo-server');
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
        const userExchange = await getExchangeByUser(args.id)
        return { ...user, "exchangesHistory": userExchange }
      } catch (error) {
        throw new ApolloError(error)
      }
    },
    // req for all Products
    async product(_, args) {
      try {
        const products = await getAllData("product")
        return products;
      } catch (error) {
        throw new ApolloError(error)
      }
    },

    // NO LO PIDE
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
    // ABM Products
    async createProduct(_, args) {
      const data = {
        name: args.name,
        description: args.description,
        availability: args.availability,
        totalPoints: args.totalPoints,
      }

      try {
        const res = await admin.firestore().collection("product").add(data)
        return res.id
      } catch (error) {
        throw new ApolloError(error)
      }
    },
    async updateProduct(_, args) {
      try {
        await admin.firestore().collection("product").doc(args.productId).update({
          name: args.name,
          description: args.description,
          availability: args.availability,
          totalPoints: args.totalPoints,
        })
        return true
      } catch (error) {
        return false
      }
    },
    async deleteProduct(_, args) {
      try {
        await admin.firestore().collection("product").doc(args.productId).delete()
        return true
      } catch (error) {
        return false
      }
    },
    async login(_, args) {
      console.log('exe login');
      let response = {
        code: 400,
        msg: ""
      }
      admin.auth().setPersistence(admin.auth.Auth.Persistence.NONE)
        .then(() => {
          if (!checkUser()) {
            console.log('!check');
            admin.auth().signInWithEmailAndPassword(args.email, args.password);
            response.code = 200
            response.msg = "Bienvenido! Iniciaste sesion correctamente."

          } else {
            console.log('check');
            response.code = 200
            response.msg = "Ya estas loggeado."
          }
        }).catch((error) => {
          response.code = error.code
          response.msg = error.message
        });

      console.log(response)
      return response
    },
    async exchangePoints(_, args) {
      const products = await getProductListByExchange(args.products)
      let totalPoints = 0;
      products.forEach(product => {
        totalPoints += product.totalPoints
      });

      const user = await getUserById(args.token)
      if (user.points > totalPoints) {
        user.points = user.points - totalPoints;
        setUser(user, args.token)

        const data = {
          date: Date.now(),
          productList: args.products,
          totalPoints: totalPoints,
          user: args.token
        }

        setNewExchange(data)
        return "Intercambio de puntos correcto"
      } else {
        return "No tenes puntos suficientes, puntos necesarios:" + totalPoints - user.points
      }
    },
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
    }
  },
};

async function setNewExchange(data) {
  const res = await admin.firestore().collection("exchange").doc().set(data)
}

function checkUser() {
  console.log('entro al checkkkkk');
  return admin.auth().currentUser;
}

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
  let productList = []
  console.log('productExchangeList', productExchangeList)
  for (let index = 0; index < productExchangeList.length; index++) {
    let productInfo = await getProductById(productExchangeList[index])
    let data = productInfo.data();
    console.log(data)
    productList.push({ "productId": productInfo.id, "name": data.name, "description": data.description, "availability": data.availability, "totalPoints": data.totalPoints })
  }
  return productList
}

async function getProductById(productId) {
  const productInfo = await admin.firestore().collection("product").doc(productId).get()
  console.log(productInfo.data())
  console.log(productId)
  return productInfo
}

async function getUserById(userId) {
  const usersDoc = await admin.firestore().collection("users").doc(userId).get();
  return usersDoc.data()
}

async function getExchangeByUser(userId) {
  let exchangeList = []
  const res = await admin.firestore().collection("exchange").where("user", "==", userId).get()
  for (let index = 0; index < res.docs.length; index++) {
    let exchangeData = res.docs[index].data()

    let productList = await getProductListByExchange(exchangeData.productList)
    exchangeList.push({ "exchangeId": res.docs[index].id, "totalPoints": exchangeData.totalPoints, "productList": productList, "date": exchangeData.date })
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
