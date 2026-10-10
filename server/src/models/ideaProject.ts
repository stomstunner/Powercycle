import { Schema, model } from 'mongoose';

const imageSchema = new Schema({
  storageKey: { type: String, required: true },
  contentType: { type: String, required: true },
  sizeBytes: { type: Number, required: true },
}, { _id: false });

const ideaProjectSchema = new Schema({
  ownerId: { type: String, required: true, index: true },
  title: { type: String, required: true, maxlength: 100 },
  shortDescription: { type: String, required: true, maxlength: 500 },
  deviceCategory: { type: String, enum: ['mobile', 'laptop', 'tablet', 'desktop', 'accessory', 'other'], required: true },
  purposeCategory: { type: String, enum: ['home_decor', 'useful_gadget', 'learning', 'art_creative', 'environmental_impact', 'other'], required: true },
  tags: [{ type: String, maxlength: 30 }],
  coverImage: { type: imageSchema, required: false },
  steps: [{
    stepId: { type: String, required: true },
    position: { type: Number, required: true },
    title: { type: String, required: true, maxlength: 100 },
    description: { type: String, required: true, maxlength: 300 },
    image: { type: imageSchema, required: false },
  }],
  status: { type: String, enum: ['draft', 'published', 'archived'], required: true, default: 'draft' },
  publishedAt: { type: Date },
}, { timestamps: true });

ideaProjectSchema.index({ status: 1, publishedAt: -1 });
ideaProjectSchema.index({ ownerId: 1, updatedAt: -1 });

export const IdeaProjectModel = model('IdeaProject', ideaProjectSchema);
