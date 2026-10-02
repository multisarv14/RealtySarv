import mongoose, { Connection, Model, Schema } from 'mongoose';
import { COLLECTIONS } from '../config/collections';

export type TenantModels = Record<string, Model<any>>;

// Documents are schemaless (strict: false) so the existing frontend types keep working unchanged.
// The app's own id (see COLLECTIONS keyField) is stored as _id.
const cache = new Map<string, TenantModels>();

/** Every tenant has its own database on the shared cluster; models are bound per database. */
export function tenantDb(dbName: string): Connection {
  return mongoose.connection.useDb(dbName, { useCache: true });
}

export function modelsFor(conn: Connection): TenantModels {
  const hit = cache.get(conn.name);
  if (hit) return hit;
  const models: TenantModels = {};
  for (const name of Object.keys(COLLECTIONS)) {
    const schema = new Schema({ _id: { type: String, required: true } }, { strict: false, versionKey: false, minimize: false, id: false });
    models[name] = conn.model(name, schema, name) as unknown as Model<any>;
  }
  cache.set(conn.name, models);
  return models;
}

// Mongo -> client shape: _id becomes the original key field again.
export function toClient(name: string, doc: any): any {
  if (!doc) return doc;
  const { _id, ...rest } = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  const keyField = COLLECTIONS[name].keyField;
  const out: any = { ...rest, [keyField]: rest[keyField] ?? _id };
  // financialSettings/applicationSettings use numeric auto ids in Dexie
  if (keyField === 'id' && typeof out.id === 'string' && /^\d+$/.test(out.id) && (name === 'financialSettings' || name === 'applicationSettings')) {
    out.id = Number(out.id);
  }
  delete out.passwordHash;
  return out;
}

// Client -> Mongo shape
export function toDoc(name: string, body: any): any {
  const keyField = COLLECTIONS[name].keyField;
  const key = body?.[keyField];
  if (key === undefined || key === null || key === '') throw new Error(`Missing "${keyField}"`);
  return { ...body, _id: String(key) };
}
