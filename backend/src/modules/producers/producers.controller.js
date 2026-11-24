import { okResponse } from '../../common/response.js';
import { validateSchema } from '../../common/validate.js';
import {
  catalogQuerySchema,
  idParamSchema,
  opsReviewSchema,
  pilotApplicationSchema,
  sellerProductCreateSchema,
  sellerProductUpdateSchema,
  slugParamSchema
} from './producers.schema.js';

export function createProducersController(service) {
  return {
    async getMe(request) {
      return okResponse(request, {
        id: request.user.id,
        email: request.user.email,
        displayName: request.user.displayName,
        role: request.user.role,
        roles: request.user.roles,
        producerIds: request.user.producerIds
      });
    },

    async listProducts(request) {
      const query = validateSchema(catalogQuerySchema, request.query || {});
      const data = await service.listPublicCatalog(query);
      return okResponse(request, data);
    },

    async getProduct(request) {
      const { slug } = validateSchema(slugParamSchema, request.params || {});
      const product = await service.getPublicProduct(slug);
      return okResponse(request, product);
    },

    async getProducer(request) {
      const { slug } = validateSchema(slugParamSchema, request.params || {});
      const data = await service.getPublicProducer(slug);
      return okResponse(request, data);
    },

    async createPilotApplication(request, reply) {
      const body = validateSchema(pilotApplicationSchema, request.body || {});
      const created = await service.submitPilotApplication(body, {
        remoteIp: request.ip,
        logger: request.log
      });
      reply.code(201);
      return okResponse(request, created);
    },

    async listSellerProducts(request) {
      const data = await service.listSellerProducts(request.user);
      return okResponse(request, data);
    },

    async createSellerProduct(request, reply) {
      const body = validateSchema(sellerProductCreateSchema, request.body || {});
      const created = await service.createSellerProduct(request.user, body);
      reply.code(201);
      return okResponse(request, created);
    },

    async updateSellerProduct(request) {
      const { id } = validateSchema(idParamSchema, request.params || {});
      const body = validateSchema(sellerProductUpdateSchema, request.body || {});
      const updated = await service.updateSellerProduct(request.user, id, body);
      return okResponse(request, updated);
    },

    async submitSellerProduct(request) {
      const { id } = validateSchema(idParamSchema, request.params || {});
      const updated = await service.submitSellerProduct(request.user, id);
      return okResponse(request, updated);
    },

    async reviewProduct(request) {
      const { id } = validateSchema(idParamSchema, request.params || {});
      const body = validateSchema(opsReviewSchema, request.body || {});
      const updated = await service.reviewProductOps(request.user, id, body);
      return okResponse(request, updated);
    }
  };
}
