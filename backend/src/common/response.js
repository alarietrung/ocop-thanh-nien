export function okResponse(request, data, meta) {
  return {
    ok: true,
    data,
    ...(meta ? { meta } : {}),
    requestId: request?.id || null
  };
}

export function errorResponse(request, { code = 'INTERNAL_ERROR', message = 'Request failed', details } = {}) {
  return {
    ok: false,
    error: {
      code,
      message,
      ...(details ? { details } : {})
    },
    requestId: request?.id || null
  };
}
