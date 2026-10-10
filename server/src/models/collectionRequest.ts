import { Schema, model } from 'mongoose';

const collectionRequestSchema = new Schema({
  userId: { type: String, required: true, index: true },
  fullName: { type: String, required: true, maxlength: 120 },
  phone: { type: String, required: true, maxlength: 30 },
  email: { type: String, required: true, maxlength: 320 },
  deviceCategory: { type: String, required: true },
  itemCount: { type: Number, required: true, min: 1, max: 50 },
  address: { type: String, required: true, maxlength: 300 },
  city: { type: String, required: true, maxlength: 80 },
  state: { type: String, required: true, maxlength: 80 },
  pinCode: { type: String, required: true, maxlength: 12 },
  preferredDate: { type: String, required: true },
  timeSlot: { type: String, required: true },
  notes: { type: String, maxlength: 1000 },
  status: { type: String, enum: ['under-review', 'accepted', 'completed', 'rejected'], default: 'under-review' },
}, { timestamps: true });

collectionRequestSchema.index({ userId: 1, createdAt: -1 });
export const CollectionRequestModel = model('CollectionRequest', collectionRequestSchema);
