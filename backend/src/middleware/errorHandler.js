import { AppError } from '../common/errors.js';
import { errorResponse } from '../common/response.js';

export function registerErrorHandlers(app, { isProd = false } = {}) {
  app.setNotFoundHandler((request, reply) => {
    reply.code(404).send(
      errorResponse(request, {
        code: 'NOT_FOUND',
        message: 'Endpoint not found'
      })
    );
  });

  app.setErrorHandler((err, request, reply) => {
    if (err instanceof AppError) {
      return reply.code(err.statusCode).send(
        errorResponse(request, {
          code: err.code,
          message: err.message,
          details: err.details
        })
      );
    }

    if (err?.statusCode === 429) {
      return reply.code(429).send(
        errorResponse(request, {
          code: 'RATE_LIMITED',
          message: 'Too many requests'
        })
      );
    }

    request.log.error({ err, requestId: request.id }, 'Unhandled server error');
    return reply.code(500).send(
      errorResponse(request, {
        code: 'INTERNAL_ERROR',
        message: isProd ? 'Internal server error' : err?.message || 'Internal server error'
      })
    );
  });
}
