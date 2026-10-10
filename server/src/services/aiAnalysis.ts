import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';
import { z } from 'zod';

export type AiAnalysis = {
  requestId: string;
  status: 'unavailable' | 'analysed';
  errorCode?: 'NOT_CONFIGURED' | 'AUTHENTICATION_FAILED' | 'MODEL_NOT_FOUND' | 'RATE_LIMITED' | 'TIMEOUT' | 'NETWORK_ERROR' | 'MALFORMED_RESPONSE';
  message?: string;
  deviceCategory?: string;
  visibleObservations?: string[];
  possibleVisibleDamage?: string[];
  uncertainties?: string[];
  safetyFlags?: string[];
};

type DeviceDetails = {
  deviceType?: string;
  brand?: string;
  modelName?: string;
  condition?: string;
  problem?: string;
};

const aiSchema = z.object({
  deviceCategory: z.string().max(100),
  visibleObservations: z.array(z.string().max(300)).max(8),
  possibleVisibleDamage: z.array(z.string().max(300)).max(8),
  uncertainties: z.array(z.string().max(300)).max(8),
  safetyFlags: z.array(z.string().max(300)).max(8),
});

export async function analyseDeviceImage(file: { buffer: Buffer; mimetype: string }, details: DeviceDetails = {}): Promise<AiAnalysis> {
  const requestId = randomUUID();
  if (!env.GEMINI_API_KEY) {
    return {
      requestId,
      status: 'unavailable',
      errorCode: 'NOT_CONFIGURED',
      message: 'Gemini is not configured. Manual assessment remains available.',
    };
  }
  const model = env.GEMINI_MODEL.replace(/^models\//, '');
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;
  const prompt = `Inspect this electronics image for preliminary visual guidance. User-provided details: ${JSON.stringify(details)}. Return JSON only with deviceCategory, visibleObservations, possibleVisibleDamage, uncertainties, safetyFlags. Never claim internal faults, battery health, value, or certified diagnosis. Mention urgent handling for swelling, smoke, leakage, exposed wiring, or overheating.`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: file.mimetype, data: file.buffer.toString('base64') } }] }], generationConfig: { responseMimeType: 'application/json' } }),
    });
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(JSON.stringify({ requestId, provider: 'gemini', model, status: response.status, response: errorBody.slice(0, 300) }));
      const errorCode = response.status === 401 || response.status === 403
        ? 'AUTHENTICATION_FAILED'
        : response.status === 404
          ? 'MODEL_NOT_FOUND'
          : response.status === 429
            ? 'RATE_LIMITED'
            : 'NETWORK_ERROR';
      const message = errorCode === 'AUTHENTICATION_FAILED'
        ? 'Gemini authentication failed. Check or replace the server GEMINI_API_KEY.'
        : errorCode === 'MODEL_NOT_FOUND'
          ? `The configured Gemini model "${model}" is not available for this API key.`
          : errorCode === 'RATE_LIMITED'
            ? 'Gemini quota or rate limit reached. Try again later.'
            : 'Gemini could not process the request right now.';
      return { requestId, status: 'unavailable', errorCode, message };
    }
    const payload = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.error(JSON.stringify({ requestId, provider: 'gemini', model, failure: 'empty_response' }));
      return { requestId, status: 'unavailable', errorCode: 'MALFORMED_RESPONSE', message: 'Gemini returned an empty response. Try another clear device photo.' };
    }
    const parsed = aiSchema.parse(JSON.parse(text));
    return { requestId, status: 'analysed', ...parsed };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gemini analysis failed';
    console.error(JSON.stringify({ requestId, provider: 'gemini', model, failure: message.slice(0, 300) }));
    const isTimeout = error instanceof DOMException && error.name === 'AbortError';
    return {
      requestId,
      status: 'unavailable',
      errorCode: error instanceof z.ZodError || error instanceof SyntaxError
        ? 'MALFORMED_RESPONSE'
        : isTimeout
          ? 'TIMEOUT'
          : 'NETWORK_ERROR',
      message: error instanceof z.ZodError || error instanceof SyntaxError
        ? 'Gemini returned an invalid response. Try another clear device photo.'
        : isTimeout
          ? 'Gemini took too long to respond. Try again with a smaller device photo.'
          : 'Gemini could not be reached. Check the server network connection and try again.',
    };
  } finally {
    clearTimeout(timeout);
  }
}
