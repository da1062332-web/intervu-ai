import { describe, it, expect, beforeEach } from 'vitest';
import { MediaValidationService } from '../media-validation.service';
import { BadRequestException } from '@nestjs/common';

describe('MediaValidationService', () => {
  let service: MediaValidationService;
  let mockConfig: any;

  beforeEach(() => {
    mockConfig = {
      maxImageSizeMb: 5,
    };
    service = new MediaValidationService(mockConfig);
  });

  describe('validateMimeType', () => {
    it('allows png, jpeg, and webp', () => {
      expect(() => service.validateMimeType('image/png')).not.toThrow();
      expect(() => service.validateMimeType('image/jpeg')).not.toThrow();
      expect(() => service.validateMimeType('image/webp')).not.toThrow();
    });

    it('rejects unsupported mime types', () => {
      expect(() => service.validateMimeType('image/gif')).toThrow(BadRequestException);
      expect(() => service.validateMimeType('application/pdf')).toThrow(BadRequestException);
    });
  });

  describe('validateMagicBytes', () => {
    it('validates png magic bytes', () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      expect(() => service.validateMagicBytes(pngBuffer, 'image/png')).not.toThrow();
    });

    it('throws error when magic bytes do not match', () => {
      const invalidBuffer = Buffer.from([0x00, 0x00, 0x00, 0x00]);
      expect(() => service.validateMagicBytes(invalidBuffer, 'image/png')).toThrow(BadRequestException);
    });
  });

  describe('validateSize', () => {
    it('allows files within max limit', () => {
      expect(() => service.validateSize(1024 * 1024)).not.toThrow();
    });

    it('rejects files exceeding max limit', () => {
      expect(() => service.validateSize(6 * 1024 * 1024)).toThrow(BadRequestException);
    });
  });
});

import { MediaAssetService } from '../media-asset.service';

describe('MediaAssetService.list', () => {
  it('coerces string page and limit parameters to numbers for Prisma', async () => {
    const mockPrisma: any = {
      mediaAsset: {
        findMany: (args: any) => {
          expect(typeof args.skip).toBe('number');
          expect(typeof args.take).toBe('number');
          expect(args.skip).toBe(0);
          expect(args.take).toBe(12);
          return Promise.resolve([]);
        },
        count: () => Promise.resolve(0),
      },
    };
    const mockStorage: any = { getPublicUrl: (key: string) => key };
    const mockValidation: any = {};

    const service = new MediaAssetService(mockPrisma, mockStorage, mockValidation);

    // Pass string query parameters as received from HTTP GET query string
    const result = await service.list({
      status: 'ACTIVE',
      page: '1' as any,
      limit: '12' as any,
    });

    expect(result.page).toBe(1);
    expect(result.limit).toBe(12);
  });
});
