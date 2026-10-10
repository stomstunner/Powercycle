import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { products } from '../data/catalog.js';
import { ProductModel } from '../models/product.js';

const connected = await connectDatabase();
if (!connected) {
  throw new Error('MONGODB_URI is required to run the seed script.');
}
for (const product of products) {
  await ProductModel.updateOne({ slug: product.slug }, { $set: product }, { upsert: true });
}
await disconnectDatabase();
console.log(`Seeded ${products.length} products idempotently.`);
