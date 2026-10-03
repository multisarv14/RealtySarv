import 'dotenv/config';
import mongoose from 'mongoose';
import { connectMongo } from './config/mongo';
import { Tenant } from './models/master';
import { tenantDb } from './models';

// Removes the throwaway companies created by the automated tests (subdomains like qa12345-ab).
// It never touches anything else, e.g. the demo company "multisarv".
(async () => {
  await connectMongo();
  for (const t of await Tenant.find({ _id: /^qa\d+/ }).lean()) {
    await tenantDb(t.dbName).dropDatabase();
    await Tenant.deleteOne({ _id: t._id });
    console.log('removed', t._id);
  }
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
