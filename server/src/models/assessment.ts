import { Schema, model } from 'mongoose';

const assessmentSchema = new Schema({
  userId: { type: String, default: null, index: true },
  deviceType: { type: String, required: true },
  ageRange: { type: String, required: true },
  condition: { type: String, required: true },
  problems: [{ type: String }],
  notes: { type: String, maxlength: 1000 },
  recommendation: { type: String, enum: ['repair', 'reuse', 'upcycle', 'recycle'], required: true },
  reason: { type: String, required: true },
  nextSteps: [{ type: String }],
  safetyFlags: [{ type: String }],
}, { timestamps: true });

assessmentSchema.index({ userId: 1, createdAt: -1 });
export const AssessmentModel = model('Assessment', assessmentSchema);
