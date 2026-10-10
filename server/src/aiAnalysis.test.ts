import { describe, expect, it } from 'vitest';
import { analyseDeviceImage } from './services/aiAnalysis.js';

describe('AI fallback', () => {
  it('returns an explicit unavailable result without credentials', async () => {
    const result = await analyseDeviceImage({ buffer: Buffer.from('test'), mimetype: 'image/png' });
    expect(result.status).toBe('unavailable');
    expect(result.requestId).toBeTruthy();
  });
});
