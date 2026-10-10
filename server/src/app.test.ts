import { describe, expect, it } from 'vitest';
import { assessmentSchema } from './schemas/assessment.js';
import { recommendAssessment } from './services/recommendation.js';
import { ideaProjectSchema, ideaStepSchema } from './schemas/ideaProject.js';

describe('recommendation service', () => {
  it('prioritizes safety for a damaged battery device', () => {
    const result = recommendAssessment({
      deviceType: 'phone',
      ageRange: '1-3',
      condition: 'damaged',
      problems: ['battery'],
    });
    expect(result.recommendation).toBe('recycle');
    expect(result.safetyFlags).toHaveLength(1);
  });

  it('recommends reuse for a working device', () => {
    const result = recommendAssessment({
      deviceType: 'laptop',
      ageRange: '3-5',
      condition: 'working',
      problems: ['none'],
    });
    expect(result.recommendation).toBe('reuse');
  });
});

describe('assessment schema', () => {
  it('rejects untrusted recommendation fields and invalid device types', () => {
    const result = assessmentSchema.safeParse({ deviceType: 'weapon', condition: 'working', problems: [] });
    expect(result.success).toBe(false);
  });

  describe('idea project validation', () => {
    it('rejects an incomplete published step', () => {
      expect(ideaStepSchema.safeParse({ stepId: 'one', title: 'Clean', description: 'short' }).success).toBe(false);
    });

    it('requires supported project categories', () => {
      expect(ideaProjectSchema.safeParse({
        title: 'A safe upcycle project',
        shortDescription: 'This project gives a disconnected device casing a useful second life.',
        deviceCategory: 'laptop',
        purposeCategory: 'unsupported',
        steps: '[]',
        status: 'published',
      }).success).toBe(false);
    });
  });
});
