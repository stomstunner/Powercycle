import { Schema, model } from 'mongoose';

const listingImageSchema = new Schema({
  storageKey: { type: String, required: true },
  contentType: { type: String, required: true },
  sizeBytes: { type: Number, required: true },
}, { _id: false });

const marketplaceListingSchema = new Schema({
  sellerUserId: { type: String, required: true, index: true },
  sourceIdeaId: { type: String, default: undefined },
  title: { type: String, required: true, maxlength: 120 },
  description: { type: String, required: true, maxlength: 2000 },
  category: { type: String, required: true, maxlength: 80 },
  condition: { type: String, enum: ['upcycled', 'refurbished', 'used_reusable'], required: true },
  images: { type: [listingImageSchema], required: true, validate: (items: unknown[]) => items.length > 0 && items.length <= 6 },
  pricePaise: { type: Number, required: true, min: 0, validate: Number.isInteger },
  currency: { type: String, enum: ['INR'], default: 'INR' },
  stockQuantity: { type: Number, required: true, min: 1, max: 10000, validate: Number.isInteger },
  status: { type: String, enum: ['draft', 'active', 'paused', 'sold_out', 'removed'], default: 'active', index: true },
  pickupAvailable: { type: Boolean, default: true },
  shippingAvailable: { type: Boolean, default: false },
  publicCity: { type: String, maxlength: 80 },
  publicState: { type: String, maxlength: 80 },
}, { timestamps: true });

marketplaceListingSchema.index({ status: 1, category: 1, createdAt: -1 });
marketplaceListingSchema.index({ sellerUserId: 1, createdAt: -1 });

export const MarketplaceListingModel = model('MarketplaceListing', marketplaceListingSchema);
