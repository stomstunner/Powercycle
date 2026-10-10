import type { RequestHandler } from 'express';
import { env } from '../config/env.js';

export type AuthenticatedUser = { id: string; email?: string };

export const requireAuth: RequestHandler = async (request, response, next) => {
  const header = request.header('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    response.status(401).json({ data: null, error: { code: 'AUTH_REQUIRED', message: 'A valid sign-in session is required.' }, meta: {} });
    return;
  }
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    response.status(503).json({ data: null, error: { code: 'AUTH_NOT_CONFIGURED', message: 'Authenticated features require server authentication configuration.' }, meta: {} });
    return;
  }
  try {
    const verification = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!verification.ok) {
      response.status(401).json({ data: null, error: { code: 'AUTH_INVALID', message: 'Your sign-in session is invalid or expired.' }, meta: {} });
      return;
    }
    const user = await verification.json() as { id?: unknown; email?: unknown };
    if (typeof user.id !== 'string' || !user.id) {
      response.status(401).json({ data: null, error: { code: 'AUTH_INVALID', message: 'Your sign-in session could not be verified.' }, meta: {} });
      return;
    }
    request.authUser = { id: user.id, email: typeof user.email === 'string' ? user.email : undefined };
    next();
  } catch {
    response.status(503).json({ data: null, error: { code: 'AUTH_VERIFICATION_UNAVAILABLE', message: 'Authentication verification is temporarily unavailable.' }, meta: {} });
  }
};
