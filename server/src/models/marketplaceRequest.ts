import { Schema, model } from 'mongoose';

const marketplaceRequestSchema = new Schema({
  listingId: { type: Schema.Types.ObjectId, required: true, index: true },
  listingTitle: { type: String, required: true, maxlength: 120 },
  unitPricePaise: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1, max: 10000 },
  buyerUserId: { type: String, required: true, index: true },
  buyerEmail: { type: String, required: true, maxlength: 320 },
  buyerPhone: { type: String, required: true, maxlength: 20 },
  sellerUserId: { type: String, required: true, index: true },
  message: { type: String, maxlength: 1000, default: '' },
  status: { type: String, enum: ['requested', 'processing', 'accepted', 'declined'], default: 'requested', index: true },
}, { timestamps: true });

marketplaceRequestSchema.index({ buyerUserId: 1, createdAt: -1 });
marketplaceRequestSchema.index({ sellerUserId: 1, createdAt: -1 });
export const MarketplaceRequestModel = model('MarketplaceRequest', marketplaceRequestSchema);
