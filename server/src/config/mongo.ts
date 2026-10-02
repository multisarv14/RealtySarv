import mongoose from 'mongoose';

export const MASTER_DB = process.env.MASTER_DB || 'realtysarv_master';

export async function connectMongo(): Promise<void> {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
  // The default connection is the master registry; each tenant database is opened via useDb().
  await mongoose.connect(uri, { dbName: MASTER_DB, serverSelectionTimeoutMS: 8000 });
  console.log(`Connected to MongoDB (master: ${MASTER_DB})`);
}
