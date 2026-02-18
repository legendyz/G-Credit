import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
// Jest mock return values are inherently `any` — safe in test context

// ── Mock setup (jest.mock is hoisted, use require-style refs) ───

// Azure SDK mock objects — populated before each test
const mockBlockBlobClient: Record<string, jest.Mock | string> = {};
const mockContainerClient: Record<string, jest.Mock> = {};

jest.mock('@azure/storage-blob', () => ({
  BlobServiceClient: {
    fromConnectionString: jest.fn().mockImplementation(() => ({
      getContainerClient: jest
        .fn()
        .mockImplementation(() => mockContainerClient),
    })),
  },
  ContainerClient: jest.fn(),
}));

// Sharp mock
const mockSharpInstance: Record<string, jest.Mock> = {};
const mockSharp = jest.fn().mockImplementation(() => mockSharpInstance);
jest.mock('sharp', () => mockSharp);

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid-v4'),
}));

const mockValidateMagicBytes = jest.fn();
jest.mock('../utils/magic-byte-validator', () => ({
  validateMagicBytes: (...args: unknown[]) => mockValidateMagicBytes(...args),
}));

// Must import AFTER jest.mock declarations
import { BlobStorageService } from './blob-storage.service';

// ── Test suite ──────────────────────────────────────────────

describe('BlobStorageService', () => {
  let service: BlobStorageService;
  let configService: { get: jest.Mock };

  const createMockFile = (
    overrides: Partial<Express.Multer.File> = {},
  ): Express.Multer.File =>
    ({
      buffer: Buffer.from('fake-png-data'),
      mimetype: 'image/png',
      size: 1024,
      originalname: 'test-badge.png',
      fieldname: 'file',
      encoding: '7bit',
      stream: null as any,
      destination: '',
      filename: '',
      path: '',
      ...overrides,
    }) as Express.Multer.File;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Re-initialise mock objects (mutated in-place so jest.mock refs work)
    Object.assign(mockBlockBlobClient, {
      upload: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
      exists: jest.fn().mockResolvedValue(true),
      url: 'https://mockaccount.blob.core.windows.net/badges/templates/mock-uuid.png',
    });

    Object.assign(mockContainerClient, {
      getBlockBlobClient: jest.fn().mockReturnValue(mockBlockBlobClient),
      createIfNotExists: jest.fn().mockResolvedValue({}),
    });

    // Reset sharp mock defaults
    Object.assign(mockSharpInstance, {
      metadata: jest.fn().mockResolvedValue({
        width: 512,
        height: 512,
        format: 'png',
      }),
      resize: jest.fn().mockReturnThis(),
      png: jest.fn().mockReturnThis(),
      jpeg: jest.fn().mockReturnThis(),
      toBuffer: jest.fn().mockResolvedValue(Buffer.from('thumbnail')),
    });
    mockSharp.mockImplementation(() => mockSharpInstance);

    // Reset magic bytes mock
    mockValidateMagicBytes.mockReturnValue({
      detected: 'image/png',
      isValid: true,
    });

    // Reset blob client mock
    (mockBlockBlobClient.upload as jest.Mock).mockResolvedValue({});
    (mockBlockBlobClient.delete as jest.Mock).mockResolvedValue({});
    (mockBlockBlobClient.exists as jest.Mock).mockResolvedValue(true);

    configService = {
      get: jest.fn((key: string, defaultVal?: string) => {
        if (key === 'AZURE_STORAGE_CONNECTION_STRING')
          return 'DefaultEndpointsProtocol=https;AccountName=test;AccountKey=key;EndpointSuffix=core.windows.net';
        if (key === 'AZURE_STORAGE_CONTAINER_BADGES')
          return defaultVal ?? 'badges';
        return defaultVal;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlobStorageService,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<BlobStorageService>(BlobStorageService);
  });

  // ═══════════════════════════════════════════════════════════
  //  onModuleInit
  // ═══════════════════════════════════════════════════════════
  describe('onModuleInit', () => {
    it('should initialize and set isAvailable=true with valid connection string', () => {
      service.onModuleInit();
      expect(service.isAvailable()).toBe(true);
    });

    it('should set isAvailable=false when no connection string', () => {
      configService.get.mockReturnValue(undefined);
      service.onModuleInit();
      expect(service.isAvailable()).toBe(false);
    });

    it('should set isAvailable=false when connection fails', () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { BlobServiceClient } = require('@azure/storage-blob');
      BlobServiceClient.fromConnectionString.mockImplementationOnce(() => {
        throw new Error('invalid connection');
      });
      service.onModuleInit();
      expect(service.isAvailable()).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════
  //  isAvailable
  // ═══════════════════════════════════════════════════════════
  describe('isAvailable', () => {
    it('should return false before onModuleInit', () => {
      expect(service.isAvailable()).toBe(false);
    });

    it('should return true after successful init', () => {
      service.onModuleInit();
      expect(service.isAvailable()).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════
  //  uploadImage
  // ═══════════════════════════════════════════════════════════
  describe('uploadImage', () => {
    beforeEach(() => {
      service.onModuleInit();
    });

    it('should upload a valid PNG image', async () => {
      const file = createMockFile();
      const result = await service.uploadImage(file);

      expect(result.url).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.width).toBe(512);
      expect(result.metadata.height).toBe(512);
      expect(result.metadata.format).toBe('png');
      expect(mockBlockBlobClient.upload).toHaveBeenCalled();
    });

    it('should upload a valid JPEG image', async () => {
      const file = createMockFile({
        mimetype: 'image/jpeg',
        originalname: 'photo.jpg',
      });
      const result = await service.uploadImage(file);

      expect(result.url).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    it('should throw for invalid file type', async () => {
      const file = createMockFile({ mimetype: 'application/pdf' });
      await expect(service.uploadImage(file)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadImage(file)).rejects.toThrow(
        /Invalid image format/,
      );
    });

    it('should throw for file exceeding 2MB', async () => {
      const file = createMockFile({ size: 3 * 1024 * 1024 });
      await expect(service.uploadImage(file)).rejects.toThrow(
        /exceeds 2MB limit/,
      );
    });

    it('should throw when magic bytes validation fails', async () => {
      mockValidateMagicBytes.mockReturnValue({
        detected: 'application/pdf',
        isValid: false,
      });
      const file = createMockFile();
      await expect(service.uploadImage(file)).rejects.toThrow(
        /does not match declared type/,
      );
    });

    it('should throw for image too small (<128px)', async () => {
      mockSharpInstance.metadata.mockResolvedValue({
        width: 64,
        height: 64,
        format: 'png',
      });
      const file = createMockFile();
      await expect(service.uploadImage(file)).rejects.toThrow(
        /Image too small/,
      );
    });

    it('should throw for image too large (>2048px)', async () => {
      mockSharpInstance.metadata.mockResolvedValue({
        width: 4096,
        height: 4096,
        format: 'png',
      });
      const file = createMockFile();
      await expect(service.uploadImage(file)).rejects.toThrow(
        /Image too large/,
      );
    });

    it('should return mock URL when storage is not available', async () => {
      (service as any).containerClient = null; // simulate unavailable

      const file = createMockFile();
      const result = await service.uploadImage(file);

      expect(result.url).toContain('mock-storage.blob.core.windows.net');
      expect(mockBlockBlobClient.upload).not.toHaveBeenCalled();
    });

    it('should use custom folder prefix', async () => {
      const file = createMockFile();
      await service.uploadImage(file, 'issued');

      const calledBlobName =
        mockContainerClient.getBlockBlobClient.mock.calls[0][0];
      expect(calledBlobName).toContain('issued/');
    });

    it('should generate thumbnail when requested', async () => {
      const file = createMockFile();
      const result = await service.uploadImage(file, 'templates', true);

      expect(result.thumbnailUrl).toBeDefined();
      expect(mockSharp).toHaveBeenCalledTimes(2); // metadata + thumbnail
    });

    it('should not include thumbnailUrl when not requested', async () => {
      const file = createMockFile();
      const result = await service.uploadImage(file, 'templates', false);

      expect(result.thumbnailUrl).toBeUndefined();
    });

    it('should handle thumbnail generation failure gracefully', async () => {
      // First call = metadata (succeed), second call = thumbnail (fail)
      mockSharp
        .mockReturnValueOnce(mockSharpInstance) // getImageMetadata
        .mockReturnValueOnce({
          resize: jest.fn().mockReturnThis(),
          toBuffer: jest
            .fn()
            .mockRejectedValue(new Error('sharp thumbnail error')),
        });

      const file = createMockFile();
      const result = await service.uploadImage(file, 'templates', true);

      // Should still return result, just without thumbnail
      expect(result.url).toBeDefined();
      expect(result.thumbnailUrl).toBeUndefined();
    });

    it('should calculate correct metadata', async () => {
      mockSharpInstance.metadata.mockResolvedValue({
        width: 1024,
        height: 512,
        format: 'jpeg',
      });

      const file = createMockFile({
        mimetype: 'image/jpeg',
        originalname: 'wide.jpg',
      });
      const result = await service.uploadImage(file);

      expect(result.metadata.width).toBe(1024);
      expect(result.metadata.height).toBe(512);
      expect(result.metadata.format).toBe('jpeg');
      expect(result.metadata.aspectRatio).toBe(2);
      expect(result.metadata.isOptimal).toBe(false);
      expect(result.metadata.suggestions).toBeDefined();
    });

    it('should set isOptimal=true for 512x512 images', async () => {
      mockSharpInstance.metadata.mockResolvedValue({
        width: 512,
        height: 512,
        format: 'png',
      });

      const file = createMockFile();
      const result = await service.uploadImage(file);

      expect(result.metadata.isOptimal).toBe(true);
    });

    it('should throw when sharp fails to read metadata', async () => {
      mockSharp.mockReturnValueOnce({
        metadata: jest.fn().mockRejectedValue(new Error('corrupt image')),
      });

      const file = createMockFile();
      await expect(service.uploadImage(file)).rejects.toThrow(
        /Failed to read image metadata/,
      );
    });

    it('should handle file without extension', async () => {
      const file = createMockFile({ originalname: 'noextension' });
      const result = await service.uploadImage(file);

      const calledBlobName =
        mockContainerClient.getBlockBlobClient.mock.calls[0][0];
      expect(calledBlobName).toContain('mock-uuid-v4');
      expect(result.url).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════════════
  //  deleteImage
  // ═══════════════════════════════════════════════════════════
  describe('deleteImage', () => {
    beforeEach(() => {
      service.onModuleInit();
    });

    it('should delete an existing image', async () => {
      (mockBlockBlobClient.exists as jest.Mock).mockResolvedValue(true);
      await service.deleteImage(
        'https://mockaccount.blob.core.windows.net/badges/templates/img.png',
      );
      expect(mockBlockBlobClient.delete).toHaveBeenCalled();
    });

    it('should throw when image does not exist', async () => {
      (mockBlockBlobClient.exists as jest.Mock).mockResolvedValue(false);
      await expect(
        service.deleteImage(
          'https://mockaccount.blob.core.windows.net/badges/templates/missing.png',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should silently return when storage not available', async () => {
      (service as any).containerClient = null;

      // Should not throw
      await service.deleteImage(
        'https://mock-storage.blob.core.windows.net/badges/templates/img.png',
      );
      expect(mockBlockBlobClient.delete).not.toHaveBeenCalled();
    });

    it('should throw for invalid URL', async () => {
      await expect(service.deleteImage('not-a-url')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ═══════════════════════════════════════════════════════════
  //  imageExists
  // ═══════════════════════════════════════════════════════════
  describe('imageExists', () => {
    beforeEach(() => {
      service.onModuleInit();
    });

    it('should return true when blob exists', async () => {
      (mockBlockBlobClient.exists as jest.Mock).mockResolvedValue(true);
      const result = await service.imageExists(
        'https://mockaccount.blob.core.windows.net/badges/templates/img.png',
      );
      expect(result).toBe(true);
    });

    it('should return false when blob does not exist', async () => {
      (mockBlockBlobClient.exists as jest.Mock).mockResolvedValue(false);
      const result = await service.imageExists(
        'https://mockaccount.blob.core.windows.net/badges/templates/missing.png',
      );
      expect(result).toBe(false);
    });

    it('should return false when storage not available (non-mock URL)', async () => {
      (service as any).containerClient = null;

      const result = await service.imageExists(
        'https://someother.blob.core.windows.net/badges/templates/img.png',
      );
      expect(result).toBe(false);
    });

    it('should return true for mock URLs when storage not available', async () => {
      (service as any).containerClient = null;

      const result = await service.imageExists(
        'https://mock-storage.blob.core.windows.net/badges/templates/img.png',
      );
      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      (mockBlockBlobClient.exists as jest.Mock).mockRejectedValue(
        new Error('network error'),
      );
      const result = await service.imageExists(
        'https://mockaccount.blob.core.windows.net/badges/templates/img.png',
      );
      expect(result).toBe(false);
    });
  });
});
