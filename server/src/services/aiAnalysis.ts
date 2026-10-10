import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';
import { z } from 'zod';

export type AiAnalysis = {
  requestId: string;
  status: 'unavailable' | 'analysed';
  errorCode?: 'NOT_CONFIGURED' | 'AUTHENTICATION_FAILED' | 'MODEL_NOT_FOUND' | 'MODEL_AGREEMENT_REQUIRED' | 'RATE_LIMITED' | 'TIMEOUT' | 'NETWORK_ERROR' | 'MALFORMED_RESPONSE';
  message?: string;
  deviceCategory?: string;
  visibleObservations?: string[];
  possibleVisibleDamage?: string[];
  uncertainties?: string[];
  safetyFlags?: string[];
};

export type RepairPlan = { steps: Array<{ title: string; description: string }>; safetyNote: string };

type DeviceDetails = {
  deviceType?: string;
  brand?: string;
  modelName?: string;
  condition?: string;
  problem?: string;
};

const MODEL = env.CLOUDFLARE_AI_MODEL;
// Llama 3.2 Vision can return 5016 until its license is accepted per account.
// Use a vision-capable Cloudflare model that does not require that acceptance.
const AGREEMENT_FALLBACK_MODEL = '@cf/qwen/qwen3.8-27b';
const aiSchema = z.object({
  deviceCategory: z.string().max(100),
  visibleObservations: z.array(z.string().max(300)).max(8),
  possibleVisibleDamage: z.array(z.string().max(300)).max(8),
  uncertainties: z.array(z.string().max(300)).max(8),
  safetyFlags: z.array(z.string().max(300)).max(8),
});

const repairPlanSchema = z.object({
  steps: z.array(z.object({ title: z.string().trim().min(3).max(100), description: z.string().trim().min(10).max(500) })).length(10),
  safetyNote: z.string().trim().min(10).max(500),
});

function isCloudflareConfigured() {
  return Boolean(env.CLOUDFLARE_ACCOUNT_ID && env.CLOUDFLARE_API_TOKEN);
}

function cloudflareEndpoint(model: string) {
  return `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(env.CLOUDFLARE_ACCOUNT_ID!)}/ai/run/${model}`;
}

function cleanModelOutput(value: string) {
  return value
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .trim();
}

async function runCloudflare(prompt: string, imageDataUri?: string, timeoutMs = 20000): Promise<string> {
  if (!isCloudflareConfigured()) throw new Error('AI_NOT_CONFIGURED');
  const run = (model: string) => fetch(cloudflareEndpoint(model), {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      ...(imageDataUri ? { image: imageDataUri } : {}),
      max_tokens: 1200,
      temperature: 0.2,
      ...(model === AGREEMENT_FALLBACK_MODEL ? { response_format: { type: 'json_object' } } : {}),
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  let model = MODEL;
  let response = await run(model);
  let body = await response.json().catch(() => null) as {
    result?: { response?: string; choices?: Array<{ text?: string; message?: { content?: string | Array<{ text?: string }> } }> };
    errors?: Array<{ code?: number; message?: string }>;
  } | null;
  const cloudflareCode = body?.errors?.[0]?.code;

  // Model 5016 is Meta's license gate, not a bad API token. Retry with Qwen
  // instead of asking the user to accept a separate model license.
  if (cloudflareCode === 5016 && MODEL !== AGREEMENT_FALLBACK_MODEL) {
    console.info(JSON.stringify({ provider: 'cloudflare', model: MODEL, fallbackModel: AGREEMENT_FALLBACK_MODEL, reason: 'MODEL_AGREEMENT_REQUIRED' }));
    model = AGREEMENT_FALLBACK_MODEL;
    response = await run(model);
    body = await response.json().catch(() => null) as typeof body;
  }

  if (!response.ok) {
    const cloudflareCode = body?.errors?.[0]?.code;
    const error = cloudflareCode === 5016
      ? 'AI_MODEL_AGREEMENT_REQUIRED'
      : response.status === 401 || (response.status === 403 && !cloudflareCode)
      ? 'AI_AUTHENTICATION_FAILED'
      : response.status === 404
        ? 'AI_MODEL_NOT_FOUND'
        : response.status === 429 || cloudflareCode === 3036
          ? 'AI_RATE_LIMITED'
          : 'AI_UNAVAILABLE';
    console.error(JSON.stringify({ provider: 'cloudflare', model, status: response.status, cloudflareCode }));
    throw new Error(error);
  }
  const choice = body?.result?.choices?.[0];
  const content = choice?.message?.content;
  const text = body?.result?.response
    ?? choice?.text
    ?? (typeof content === 'string' ? content : content?.map((part) => part.text ?? '').join(''));
  if (typeof text !== 'string' || !text.trim()) throw new Error('AI_INVALID_RESPONSE');
  return cleanModelOutput(text);
}

function configuredErrorMessage(code: string) {
  if (code === 'AI_NOT_CONFIGURED') return 'Cloudflare AI is not configured on the server yet.';
  if (code === 'AI_AUTHENTICATION_FAILED') return 'Cloudflare rejected the server credentials. Check the account ID and API token in Render.';
  if (code === 'AI_MODEL_AGREEMENT_REQUIRED') return 'The configured Cloudflare AI model requires a license agreement. Configure a different vision model or accept its terms in Cloudflare.';
  if (code === 'AI_MODEL_NOT_FOUND') return `Cloudflare could not find the model "${MODEL}" for this account.`;
  if (code === 'AI_RATE_LIMITED') return 'Cloudflare AI quota or rate limit was reached. Try again later.';
  if (code === 'AI_INVALID_RESPONSE') return 'Cloudflare returned an invalid response. Try again with a clear device photo.';
  return 'Cloudflare AI could not process the request right now.';
}

export async function generateRepairPlan(details: { deviceType: string; brand?: string; modelName?: string; condition: string; problems: string[]; notes?: string; aiAnalysis?: AiAnalysis }): Promise<RepairPlan> {
  const prompt = `Create a conservative, safe repair or reuse plan for this assessed device. Details: ${JSON.stringify(details)}. Return JSON only with exactly 10 ordered steps, each with title and description, and safetyNote. Only steps a non-expert can do without opening the device: external checks, settings, backups, cleaning exterior while unplugged, checking a known-good cable/charger, warranty/service research, data protection, repair-shop preparation, and responsible reuse/recycling. Never instruct opening electronics, puncturing/heating batteries, working on swollen/damaged batteries, mains voltage, chargers/power supplies, capacitors, soldering, or bypassing safety features. If there are hazardous symptoms, steps must stop use and arrange qualified service/recycling. Never promise a repair will work.`;
  const text = await runCloudflare(prompt);
  const plan = repairPlanSchema.parse(JSON.parse(text));
  const riskyInstruction = /\b(open|disassemble|unscrew|solder|puncture|heat|remove battery|bypass|short circuit|mains voltage|capacitor)\b/i;
  if (plan.steps.some((step) => riskyInstruction.test(`${step.title} ${step.description}`))) throw new Error('AI_INVALID_RESPONSE');
  return plan;
}

export async function analyseDeviceImage(file: { buffer: Buffer; mimetype: string }, details: DeviceDetails = {}): Promise<AiAnalysis> {
  const requestId = randomUUID();
  if (!isCloudflareConfigured()) {
    return { requestId, status: 'unavailable', errorCode: 'NOT_CONFIGURED', message: 'Cloudflare AI is not configured. Manual assessment remains available.' };
  }
  const prompt = `Inspect this electronics image for preliminary visual guidance. User-provided details: ${JSON.stringify(details)}. Return JSON only with deviceCategory, visibleObservations, possibleVisibleDamage, uncertainties, safetyFlags. Each field must match this shape: deviceCategory is a short string; the other fields are arrays of short strings (empty arrays are allowed). Never claim internal faults, battery health, value, or certified diagnosis. Mention urgent handling for swelling, smoke, leakage, exposed wiring, or overheating.`;
  try {
    const imageDataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    const text = await runCloudflare(prompt, imageDataUri, 25000);
    const parsed = aiSchema.parse(JSON.parse(text));
    return { requestId, status: 'analysed', ...parsed };
  } catch (error) {
    const code = error instanceof Error ? error.message : 'AI_UNAVAILABLE';
    console.error(JSON.stringify({ requestId, provider: 'cloudflare', model: MODEL, failure: code.slice(0, 100) }));
    const errorCode: AiAnalysis['errorCode'] = code === 'AI_NOT_CONFIGURED'
      ? 'NOT_CONFIGURED'
      : code === 'AI_AUTHENTICATION_FAILED'
        ? 'AUTHENTICATION_FAILED'
        : code === 'AI_MODEL_NOT_FOUND'
          ? 'MODEL_NOT_FOUND'
          : code === 'AI_MODEL_AGREEMENT_REQUIRED'
            ? 'MODEL_AGREEMENT_REQUIRED'
          : code === 'AI_RATE_LIMITED'
            ? 'RATE_LIMITED'
            : error instanceof z.ZodError || error instanceof SyntaxError || code === 'AI_INVALID_RESPONSE'
              ? 'MALFORMED_RESPONSE'
              : error instanceof DOMException && error.name === 'TimeoutError'
                ? 'TIMEOUT'
                : 'NETWORK_ERROR';
    return { requestId, status: 'unavailable', errorCode, message: errorCode === 'TIMEOUT' ? 'Cloudflare AI took too long to respond. Try again with a smaller device photo.' : configuredErrorMessage(code) };
  }
}

export function cloudflareAiStatus() {
  return { configured: isCloudflareConfigured(), provider: 'cloudflare', model: MODEL };
}

export function cloudflareAiErrorMessage(code: string) {
  return configuredErrorMessage(code);
}
