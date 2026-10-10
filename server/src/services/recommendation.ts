import type { AssessmentInput } from '../schemas/assessment.js';

export type Recommendation = 'repair' | 'reuse' | 'upcycle' | 'recycle';

export type RecommendationResult = {
  recommendation: Recommendation;
  reason: string;
  nextSteps: string[];
  safetyFlags: string[];
};

const safetyProblems = new Set(['battery', 'damaged']);

export function recommendAssessment(input: AssessmentInput): RecommendationResult {
  const safetyFlags: string[] = [];
  if (input.problems.some((problem) => safetyProblems.has(problem)) && input.condition === 'damaged') {
    safetyFlags.push('Do not charge, open, puncture, or DIY-upcycle this item. Seek qualified handling.');
  }
  if (input.condition === 'not-working' || input.condition === 'major-issue' || input.condition === 'damaged') {
    return {
      recommendation: 'recycle',
      reason: 'The reported condition suggests professional assessment or responsible recycling is safer than reuse.',
      nextSteps: ['Keep the item unplugged and dry.', 'Ask a qualified repair or recycling service how to handle it.'],
      safetyFlags,
    };
  }
  if (input.condition === 'minor-issue') {
    return {
      recommendation: 'repair',
      reason: 'A common or minor issue may be repairable, extending the device lifetime.',
      nextSteps: ['Back up personal data if possible.', 'Seek a qualified assessment before opening the device.'],
      safetyFlags,
    };
  }
  if (input.condition === 'working') {
    return {
      recommendation: 'reuse',
      reason: 'A working device can usually serve another user or purpose before recycling.',
      nextSteps: ['Remove personal data securely.', 'Consider donating, selling, or repurposing it.'],
      safetyFlags,
    };
  }
  return {
    recommendation: 'upcycle',
    reason: 'The available information suggests a non-destructive creative reuse may be appropriate, but this is not a certified diagnosis.',
    nextSteps: ['Choose a safe, non-powered project.', 'Do not disassemble batteries, power supplies, or mains devices.'],
    safetyFlags,
  };
}
