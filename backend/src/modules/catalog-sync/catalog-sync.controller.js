import { okResponse } from '../../common/response.js';
import { validateSchema } from '../../common/validate.js';
import { addListingSchema, productIdParamSchema } from './catalog-sync.schema.js';

export function createCatalogSyncController(service) {
  return {
    async getStatus(request) {
      return okResponse(request, service.getMarketplaceAdapterStatus());
    },

    async addListing(request, reply) {
      const { id } = validateSchema(productIdParamSchema, request.params || {});
      const body = validateSchema(addListingSchema, request.body || {});
      const created = await service.addProductListing(request.user, id, body);
      reply.code(201);
      return okResponse(request, created);
    }
  };
}
