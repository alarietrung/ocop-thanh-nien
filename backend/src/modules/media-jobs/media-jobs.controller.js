import { okResponse } from '../../common/response.js';
import { validateSchema } from '../../common/validate.js';
import { uploadCompleteSchema, uploadInitSchema } from './media-jobs.schema.js';

export function createMediaJobsController(service) {
  return {
    async listTemplates(request) {
      const items = await service.listVideoTemplates();
      return okResponse(request, items);
    },

    async initUpload(request, reply) {
      const body = validateSchema(uploadInitSchema, request.body || {});
      const data = await service.initUpload(request.user, body);
      reply.code(201);
      return okResponse(request, data);
    },

    async completeUpload(request) {
      const body = validateSchema(uploadCompleteSchema, request.body || {});
      const data = await service.completeUpload(request.user, body);
      return okResponse(request, data);
    }
  };
}
