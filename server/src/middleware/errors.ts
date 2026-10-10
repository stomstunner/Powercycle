import type { ErrorRequestHandler, RequestHandler } from 'express';

export const notFound: RequestHandler = (_request, response) => {
  response.status(404).json({
    data: null,
    error: { code: 'NOT_FOUND', message: 'The requested resource was not found.' },
    meta: {},
  });
};

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  void _next;
  if (error instanceof Error && error.message) console.error(error.message);
  const status = error?.code === 'LIMIT_FILE_SIZE' ? 413 : 500;
  const code = status === 413 ? 'PAYLOAD_TOO_LARGE' : 'INTERNAL_ERROR';
  response.setHeader('x-request-id', request.header('x-request-id') ?? 'unknown');
  response.status(status).json({
    data: null,
    error: { code, message: status === 413 ? 'The uploaded file is too large.' : 'An unexpected server error occurred.' },
    meta: {},
  });
};
