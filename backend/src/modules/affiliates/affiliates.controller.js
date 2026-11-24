import { okResponse } from '../../common/response.js';
import { validateSchema } from '../../common/validate.js';
import {
  createAffiliateLinkSchema,
  linkIdParamSchema,
  redirectCodeParamSchema
} from './affiliates.schema.js';

export function createAffiliatesController(service) {
  return {
    async listLinks(request) {
      const items = await service.listMyLinks(request.user);
      return okResponse(request, items);
    },

    async createLink(request, reply) {
      const body = validateSchema(createAffiliateLinkSchema, request.body || {});
      const created = await service.createLink(request.user, body);
      reply.code(201);
      return okResponse(request, created);
    },

    async deactivateLink(request) {
      const { id } = validateSchema(linkIdParamSchema, request.params || {});
      const updated = await service.deactivateLink(request.user, id);
      return okResponse(request, updated);
    },

    async lookupRedirect(request) {
      const { code } = validateSchema(redirectCodeParamSchema, request.params || {});
      const info = await service.lookupPublicRedirect(code);
      return okResponse(request, info);
    },

    async visitRedirect(request) {
      const { code } = validateSchema(redirectCodeParamSchema, request.params || {});
      const result = await service.recordIntentionalVisit(code, request.headers?.['user-agent'] || '');
      return okResponse(request, result);
    }
  };
}
