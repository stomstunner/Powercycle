import { Schema, model } from 'mongoose';

const feedbackSchema = new Schema({
  userId: { type: String, required: true, index: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  topic: { type: String, required: true, maxlength: 40 },
  message: { type: String, required: true, maxlength: 2000 },
}, { timestamps: true });

feedbackSchema.index({ userId: 1, createdAt: -1 });
export const FeedbackModel = model('Feedback', feedbackSchema);
