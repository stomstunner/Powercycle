import type { RequestHandler } from 'express';
import type { z } from 'zod';

export function validateBody(schema: z.ZodType): RequestHandler {
  return (request, response, next) => {
    const result = schema.safeParse(request.body);
    if (!result.success) {
      response.status(400).json({
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'Please check the submitted fields.' },
        meta: {},
      });
      return;
    }
    request.body = result.data;
    next();
  };
}
