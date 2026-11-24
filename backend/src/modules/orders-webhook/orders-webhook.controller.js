import { okResponse } from '../../common/response.js';
import { validateSchema } from '../../common/validate.js';
import {
  batchIdParamSchema,
  previewImportSchema,
  webhookPlatformParamSchema
} from './orders-webhook.schema.js';

export function createOrdersWebhookController(service) {
  return {
    async listSellerOrders(request) {
      const items = await service.listSellerOrders(request.user);
      return okResponse(request, items);
    },

    async previewImport(request) {
      const body = validateSchema(previewImportSchema, request.body || {});
      const data = await service.previewImport(request.user, body);
      return okResponse(request, data);
    },

    async commitImport(request) {
      const { id } = validateSchema(batchIdParamSchema, request.params || {});
      const data = await service.commitImport(request.user, id);
      return okResponse(request, data);
    },

    async handleWebhook(request) {
      const { platform } = validateSchema(webhookPlatformParamSchema, request.params || {});
      return service.handleMarketplaceWebhook(platform);
    }
  };
}
