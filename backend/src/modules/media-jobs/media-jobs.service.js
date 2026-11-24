import { randomUUID } from 'node:crypto';
import { ForbiddenError, NotFoundError, ValidationError } from '../../common/errors.js';

const MIME_EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'video/webm': 'webm',
  'video/mp4': 'mp4'
};

export function createMediaJobsService({ repo, producersApi }) {
  return {
    async listVideoTemplates() {
      return repo.listVideoTemplates();
    },

    async initUpload(actor, { producerId, mimeType, sizeBytes, kind }) {
      if (!actor.producerIds?.includes(producerId) && actor.role !== 'ops') {
        throw new ForbiddenError('Không có quyền upload media cho cơ sở OCOP khác.');
      }
      if (kind === 'product_image' && !mimeType.startsWith('image/')) {
        throw new ValidationError('Ảnh sản phẩm chỉ nhận JPEG, PNG hoặc WebP.');
      }
      if (kind === 'product_image' && sizeBytes > 5 * 1024 * 1024) {
        throw new ValidationError('Ảnh sản phẩm không vượt quá 5MB.');
      }

      const ext = MIME_EXT[mimeType] || 'bin';
      const bucket = kind === 'product_image' ? 'ocop-public-media' : 'ocop-private-media';
      const storagePath = `${bucket}/${producerId}/${kind}/${randomUUID()}.${ext}`;

      const asset = await repo.createMediaAsset(actor, {
        ownerUserId: actor.id,
        producerId,
        storagePath,
        mimeType,
        sizeBytes
      });

      return {
        assetId: asset.id,
        bucket,
        storagePath,
        uploadStrategy: 'direct_to_storage_scoped_path',
        maxSizeBytes: kind === 'product_image' ? 5 * 1024 * 1024 : 52428800
      };
    },

    async completeUpload(actor, { assetId }) {
      const res = await repo.markMediaReady(actor, assetId);
      if (res === null) throw new NotFoundError('Không tìm thấy tài nguyên media.');
      if (res === 'FORBIDDEN') throw new ForbiddenError('Không có quyền xác nhận tài nguyên của chủ thể khác.');
      await producersApi.logAudit(actor, {
        action: 'MEDIA_UPLOAD_COMPLETE',
        targetType: 'media_asset',
        targetId: res.id,
        detail: `Xác nhận media ${res.mimeType}`
      });
      return res;
    }
  };
}
