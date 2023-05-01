import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import admin, { ServiceAccount } from 'firebase-admin';
import serviceAccount from '../raxiom-v1-firebase-adminsdk.json' assert { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount)
})

class FirebaseAdmin {
  #firebaseAdmin = null

  constructor(credential: ServiceAccount) {
    this.#firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert(credential)
    })
  }

  getDatabase() {
    return this.#firebaseAdmin.firestore()
  }
}

class Firestore {
  #firestore = null

  constructor(db) {
    this.#firestore = db
  }

  addToCollection(collection: string, payload: any): Promise<any> {
    const db = this.#firestore
    const targetCollection = db.collection(collection)
    return db.collection.add(payload)
  }

}

const db = admin.firestore();

const typeDefs = `
  type User {
    id: ID!
    name: String!
    email: String!
    createdAt: String!
    updatedAt: String!
  }

  type Query {
    getUser(id: ID!): User
  }

  type Mutation {
    createUser(name: String!, email: String!): User!
  }
`;

const resolvers = {
  Query: {
    getUser: async (parent, { id }, context) => {
      const doc = await db.collection('users').doc(id).get();
      const data = doc.data();
      return {
        id: doc.id,
        ...data
      };
    }
  },
  Mutation: {
    createUser: async (parent, args, context) => {
      const { name, email } = args;
      const now = new Date().toISOString();
      const userRef = await db.collection('users').add({
        name,
        email,
        createdAt: now,
        updatedAt: now
      });
      const userDoc = await userRef.get();
      const userData = userDoc.data();
      return {
        id: userDoc.id,
        ...userData
      };
    }
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const { url } = await startStandaloneServer(server, {
  listen: { port: +process.env.PORT || 4000 },
});

console.log(`🚀  Server ready at: ${url}`);



