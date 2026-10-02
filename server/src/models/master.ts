import mongoose, { Schema } from 'mongoose';

// Master registry (database "realtysarv_master"): one row per client company.
// _id is the subdomain, e.g. "multisarv" for multisarv.realtysarv.com.
const tenantSchema = new Schema({
  _id: { type: String, required: true },
  companyName: { type: String, required: true },
  dbName: { type: String, required: true, unique: true },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  plan: String,
  modules: { crm: Boolean, erp: Boolean },
  createdAt: { type: Date, default: Date.now },
}, { versionKey: false, id: false });

export const Tenant = mongoose.model('Tenant', tenantSchema, 'tenants');
