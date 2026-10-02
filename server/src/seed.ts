import 'dotenv/config';
import mongoose from 'mongoose';
import { connectMongo } from './config/mongo';
import { Tenant } from './models/master';
import { modelsFor, tenantDb } from './models';
import { seedTenant } from './seedData';

// Creates (or with --reset, recreates) the demo workspace: multisarv.<your-domain>, login ss / sss.
const SUB = 'multisarv';

async function main() {
  await connectMongo();
  const dbName = `rs_${SUB}`;
  const exists = await Tenant.exists({ _id: SUB });
  if (exists && !process.argv.includes('--reset')) { console.log(`Tenant "${SUB}" already exists (use --reset to rebuild it)`); }
  else {
    await tenantDb(dbName).dropDatabase();
    await Tenant.deleteOne({ _id: SUB });
    await Tenant.create({ _id: SUB, companyName: 'MultiSarv Pvt.Ltd', dbName, status: 'active', plan: 'Professional', modules: { crm: true, erp: true } });
    await seedTenant(modelsFor(tenantDb(dbName)), { demo: true });
    console.log(`Seeded demo tenant "${SUB}" -> ${dbName}`);
  }
  await mongoose.disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
