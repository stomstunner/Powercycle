import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';

export function storageConfigured() {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY && env.SUPABASE_STORAGE_BUCKET);
}

function storageHeaders(contentType: string) {
  return {
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    apikey: env.SUPABASE_SERVICE_ROLE_KEY!,
    'Content-Type': contentType,
  };
}

async function uploadImage(prefix: string, ownerId: string, file: Express.Multer.File) {
  if (!storageConfigured()) throw new Error('STORAGE_NOT_CONFIGURED');
  const key = `${prefix ? `${prefix}/` : ''}${ownerId}/${randomUUID()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const result = await fetch(`${env.SUPABASE_URL}/storage/v1/object/${env.SUPABASE_STORAGE_BUCKET}/${key}`, {
    method: 'POST',
    headers: { ...storageHeaders(file.mimetype), 'x-upsert': 'false' },
    body: new Uint8Array(file.buffer),
  });
  if (!result.ok) throw new Error('IMAGE_UPLOAD_FAILED');
  return { storageKey: key, contentType: file.mimetype, sizeBytes: file.size };
}

export async function uploadIdeaImage(ownerId: string, file: Express.Multer.File) {
  return uploadImage('', ownerId, file);
}

export async function uploadMarketplaceImage(ownerId: string, file: Express.Multer.File) {
  return uploadImage('marketplace', ownerId, file);
}

export async function removeIdeaImage(storageKey: string) {
  if (!storageConfigured()) return;
  await fetch(`${env.SUPABASE_URL}/storage/v1/object/${env.SUPABASE_STORAGE_BUCKET}`, {
    method: 'DELETE',
    headers: storageHeaders('application/json'),
    body: JSON.stringify({ prefixes: [storageKey] }),
  });
}

export function publicIdeaImageUrl(storageKey: string) {
  return `${env.SUPABASE_URL}/storage/v1/object/public/${env.SUPABASE_STORAGE_BUCKET}/${storageKey}`;
}

export async function signedIdeaImageUrl(storageKey: string, expiresIn = 3600) {
  if (!storageConfigured()) throw new Error('STORAGE_NOT_CONFIGURED');
  const result = await fetch(`${env.SUPABASE_URL}/storage/v1/object/sign/${env.SUPABASE_STORAGE_BUCKET}/${storageKey}`, {
    method: 'POST',
    headers: storageHeaders('application/json'),
    body: JSON.stringify({ expiresIn }),
  });
  if (!result.ok) throw new Error('IMAGE_SIGN_FAILED');
  const body = await result.json() as { signedURL?: string };
  if (!body.signedURL) throw new Error('IMAGE_SIGN_FAILED');
  return body.signedURL.startsWith('http') ? body.signedURL : `${env.SUPABASE_URL}/storage/v1${body.signedURL}`;
}
