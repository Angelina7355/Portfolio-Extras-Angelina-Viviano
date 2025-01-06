// HANDLES THE CONNECTION TO MongoDB
const { MongoClient } = require('mongodb');

let db;

const connectToDatabase = async () => {
  try {
    const client = new MongoClient('mongodb+srv://Angelina7355:Kaylee7355!@anime-site-cluster.uspg6.mongodb.net/?retryWrites=true&w=majority&appName=anime-site-cluster', {
    });

    await client.connect();
    db = client.db('anime-site'); // Replace with your database name
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
};

const getDb = () => {
  if (!db) {
    throw new Error("Database connection is not established");
  }
  return db;
};

module.exports = { connectToDatabase, getDb };
