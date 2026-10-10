import { Schema, model } from 'mongoose';

const productSchema = new Schema({
  slug: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, maxlength: 160 },
  description: { type: String, required: true, maxlength: 2000 },
  priceInr: { type: Number, required: true, min: 0, validate: Number.isInteger },
  category: { type: String, required: true, maxlength: 80 },
  sourceMaterial: { type: String, required: true, maxlength: 300 },
  conditionNote: { type: String, required: true, maxlength: 500 },
  isDemo: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const ProductModel = model('Product', productSchema);
