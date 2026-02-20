import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('Missing MONGODB_URI in environment variables');
}
const client = new MongoClient(uri);

let db = null;

export async function connectDB() {
  try {
    await client.connect();
    db = client.db();
    console.log('Connected to MongoDB Atlas');
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

export function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return db;
}

export async function closeDB() {
  await client.close();
  console.log('MongoDB connection closed');
}
