import { Test, TestingModule } from '@nestjs/testing';
import { EvidenceService } from './evidence.service';
import { PrismaService } from '../common/prisma.service';
import { StorageService } from '../common/storage.service';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

describe('EvidenceService - Story 4.3', () => {
  let service: EvidenceService;
  let _prismaService: PrismaService;
  let _storageService: StorageService;

  const mockPrismaService = {
    badge: {
      findUnique: jest.fn(),
    },
    evidenceFile: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const mockStorageService = {
    uploadEvidence: jest.fn(),
    generateEvidenceSasUrl: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvidenceService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
      ],
    }).compile();

    service = module.get<EvidenceService>(EvidenceService);
    _prismaService = module.get<PrismaService>(PrismaService);
    _storageService = module.get<StorageService>(StorageService);

    jest.clearAllMocks();
  });

  describe('uploadEvidence', () => {
    const mockBadge = {
      id: 'badge-123',
      recipientId: 'user-123',
      issuerId: 'user-admin', // Required for authorization check
    };

    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'certificate.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      size: 5 * 1024 * 1024, // 5MB
      buffer: Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]), // %PDF-1.4 magic bytes
      stream: null!,
      destination: '',
      filename: '',
      path: '',
    };

    it('should upload evidence file successfully (AC 3.7)', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);
      mockStorageService.uploadEvidence.mockResolvedValue(
        'https://storage.blob.core.windows.net/evidence/badge-123/file-uuid-certificate.pdf',
      );
      mockPrismaService.evidenceFile.create.mockResolvedValue({
        id: 'file-uuid',
        badgeId: 'badge-123',
        fileName: 'badge-123/file-uuid-certificate.pdf',
        originalName: 'certificate.pdf',
        fileSize: mockFile.size,
        mimeType: 'application/pdf',
        blobUrl: 'https://storage.blob.core.windows.net/evidence/...',
        uploadedBy: 'user-admin',
        uploadedAt: new Date(),
      });

      const result = await service.uploadEvidence(
        'badge-123',
        mockFile,
        'user-admin',
      );

      expect(result).toBeDefined();
      expect(result.originalName).toBe('certificate.pdf');
      expect(result.mimeType).toBe('application/pdf');
      expect(mockStorageService.uploadEvidence).toHaveBeenCalled();
      expect(mockPrismaService.evidenceFile.create).toHaveBeenCalled();
    });

    it('should reject file larger than 10MB (AC 3.7)', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);

      const largeFile = {
        ...mockFile,
        size: 11 * 1024 * 1024, // 11MB
      };

      await expect(
        service.uploadEvidence('badge-123', largeFile, 'user-admin'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.uploadEvidence('badge-123', largeFile, 'user-admin'),
      ).rejects.toThrow('File size exceeds 10MB limit');
    });

    it('should reject invalid MIME type (AC 3.7)', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);

      const invalidFile = {
        ...mockFile,
        mimetype: 'video/mp4',
      };

      await expect(
        service.uploadEvidence('badge-123', invalidFile, 'user-admin'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.uploadEvidence('badge-123', invalidFile, 'user-admin'),
      ).rejects.toThrow('File type video/mp4 not allowed');
    });

    it('should throw NotFoundException if badge not found', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(null);

      await expect(
        service.uploadEvidence('invalid-badge', mockFile, 'user-admin'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should sanitize filename (AC 3.4)', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);
      mockStorageService.uploadEvidence.mockResolvedValue('https://...');
      mockPrismaService.evidenceFile.create.mockResolvedValue({
        id: 'file-uuid',
        fileName: 'badge-123/file-uuid-my_certificate.pdf',
        originalName: 'my certificate!@#.pdf',
        fileSize: mockFile.size,
        mimeType: 'application/pdf',
        blobUrl: 'https://...',
        uploadedBy: 'user-admin',
        uploadedAt: new Date(),
      });

      const fileWithSpecialChars = {
        ...mockFile,
        originalname: 'my certificate!@#.pdf',
      };

      const _result = await service.uploadEvidence(
        'badge-123',
        fileWithSpecialChars,
        'user-admin',
      );

      // Filename should be sanitized (special chars replaced with _)
      expect(mockStorageService.uploadEvidence).toHaveBeenCalledWith(
        expect.stringMatching(/badge-123\/[a-f0-9-]+-my_certificate___.pdf/),
        expect.any(Buffer),
        'application/pdf',
      );
    });
  });

  describe('listEvidence', () => {
    const mockBadge = {
      id: 'badge-123',
      recipientId: 'user-123',
      issuerId: 'user-issuer',
    };

    const mockEvidenceFiles = [
      {
        id: 'file-1',
        badgeId: 'badge-123',
        fileName: 'badge-123/file-1-cert.pdf',
        originalName: 'certificate.pdf',
        fileSize: 1000000,
        mimeType: 'application/pdf',
        blobUrl: 'https://...',
        uploadedAt: new Date(),
      },
    ];

    it('should list evidence files for badge owner (AC 3.8)', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);
      mockPrismaService.evidenceFile.findMany.mockResolvedValue(
        mockEvidenceFiles,
      );

      const result = await service.listEvidence(
        'badge-123',
        'user-123',
        'EMPLOYEE',
      );

      expect(result).toHaveLength(1);
      expect(result[0].originalName).toBe('certificate.pdf');
      expect(mockPrismaService.evidenceFile.findMany).toHaveBeenCalledWith({
        where: { badgeId: 'badge-123' },
        orderBy: { uploadedAt: 'desc' },
      });
    });

    it('should allow ADMIN to list any badge evidence (AC 3.8)', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);
      mockPrismaService.evidenceFile.findMany.mockResolvedValue(
        mockEvidenceFiles,
      );

      const result = await service.listEvidence(
        'badge-123',
        'admin-user',
        'ADMIN',
      );

      expect(result).toHaveLength(1);
    });

    it('should allow ISSUER who issued the badge to list evidence', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);
      mockPrismaService.evidenceFile.findMany.mockResolvedValue(
        mockEvidenceFiles,
      );

      const result = await service.listEvidence(
        'badge-123',
        'user-issuer',
        'ISSUER',
      );

      expect(result).toHaveLength(1);
    });

    it('should reject non-owner non-issuer non-admin (AC 3.8)', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);

      await expect(
        service.listEvidence('badge-123', 'other-user', 'EMPLOYEE'),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.listEvidence('badge-123', 'other-user', 'EMPLOYEE'),
      ).rejects.toThrow('You do not have access to this badge');
    });
  });

  describe('generateDownloadSas', () => {
    const mockBadge = {
      id: 'badge-123',
      recipientId: 'user-123',
      issuerId: 'user-issuer',
    };

    const mockEvidenceFile = {
      id: 'file-1',
      badgeId: 'badge-123',
      fileName: 'badge-123/file-1-cert.pdf',
      mimeType: 'application/pdf',
    };

    it('should generate SAS token for download (AC 3.9)', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);
      mockPrismaService.evidenceFile.findUnique.mockResolvedValue(
        mockEvidenceFile,
      );

      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min
      mockStorageService.generateEvidenceSasUrl.mockReturnValue({
        url: 'https://storage.blob.core.windows.net/evidence/...?sasToken=...',
        expiresAt,
      });

      const result = await service.generateDownloadSas(
        'badge-123',
        'file-1',
        'user-123',
        'EMPLOYEE',
      );

      expect(result.url).toContain('sasToken');
      expect(result.expiresAt).toBeDefined();
      expect(result.isImage).toBe(false);
      expect(mockStorageService.generateEvidenceSasUrl).toHaveBeenCalledWith(
        'badge-123/file-1-cert.pdf',
      );
    });

    it('should detect image files (AC 3.10)', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);
      mockPrismaService.evidenceFile.findUnique.mockResolvedValue({
        ...mockEvidenceFile,
        mimeType: 'image/png',
      });

      const expiresAt = new Date();
      mockStorageService.generateEvidenceSasUrl.mockReturnValue({
        url: 'https://...',
        expiresAt,
      });

      const result = await service.generateDownloadSas(
        'badge-123',
        'file-1',
        'user-123',
        'EMPLOYEE',
      );

      expect(result.isImage).toBe(true);
    });

    it('should reject unauthorized access (AC 3.9)', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);

      await expect(
        service.generateDownloadSas(
          'badge-123',
          'file-1',
          'other-user',
          'EMPLOYEE',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow ISSUER who issued the badge to download evidence', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);
      mockPrismaService.evidenceFile.findUnique.mockResolvedValue({
        id: 'file-1',
        badgeId: 'badge-123',
        fileName: 'badge-123/file-1-cert.pdf',
        mimeType: 'application/pdf',
      });

      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
      mockStorageService.generateEvidenceSasUrl.mockReturnValue({
        url: 'https://storage.blob.core.windows.net/evidence/...?sasToken=...',
        expiresAt,
      });

      const result = await service.generateDownloadSas(
        'badge-123',
        'file-1',
        'user-issuer',
        'ISSUER',
      );

      expect(result.url).toContain('sasToken');
      expect(result.expiresAt).toBeDefined();
    });

    it('should reject download/preview for URL-type evidence (Story 12.5)', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);
      mockPrismaService.evidenceFile.findUnique.mockResolvedValue({
        id: 'file-1',
        badgeId: 'badge-123',
        type: 'URL',
        sourceUrl: 'https://example.com/evidence',
        fileName: '',
        blobUrl: '',
      });

      await expect(
        service.generateDownloadSas(
          'badge-123',
          'file-1',
          'user-123',
          'EMPLOYEE',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // Story 12.5: URL-type evidence tests
  describe('addUrlEvidence', () => {
    const mockBadge = {
      id: 'badge-123',
      recipientId: 'user-123',
      issuerId: 'user-admin',
    };

    it('should create URL-type evidence record', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);
      mockPrismaService.evidenceFile.create.mockResolvedValue({
        id: 'ev-uuid-1',
        badgeId: 'badge-123',
        type: 'URL',
        sourceUrl: 'https://example.com/evidence',
        fileName: '',
        originalName: 'example.com',
        fileSize: 0,
        mimeType: '',
        blobUrl: '',
        uploadedBy: 'user-admin',
        uploadedAt: new Date(),
      });

      const result = await service.addUrlEvidence(
        'badge-123',
        'https://example.com/evidence',
        'user-admin',
      );

      expect(result).toBeDefined();
      expect(result.type).toBe('URL');
      expect(result.sourceUrl).toBe('https://example.com/evidence');
      expect(result.originalName).toBe('example.com');
      expect(mockPrismaService.evidenceFile.create).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({
            type: 'URL',
            sourceUrl: 'https://example.com/evidence',
            fileName: '',
            fileSize: 0,
          }),
        }),
      );
    });

    it('should validate URL format', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);

      await expect(
        service.addUrlEvidence('badge-123', 'not-a-url', 'user-admin'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject non-http/https protocols', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);

      await expect(
        service.addUrlEvidence(
          'badge-123',
          'ftp://example.com/file',
          'user-admin',
        ),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.addUrlEvidence('badge-123', 'file:///etc/passwd', 'user-admin'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should enforce IDOR protection (issuer or ADMIN)', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);

      await expect(
        service.addUrlEvidence(
          'badge-123',
          'https://example.com/evidence',
          'other-user',
          'EMPLOYEE',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException for invalid badge', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(null);

      await expect(
        service.addUrlEvidence(
          'nonexistent',
          'https://example.com/evidence',
          'user-admin',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should allow ADMIN to add URL evidence for any badge', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);
      mockPrismaService.evidenceFile.create.mockResolvedValue({
        id: 'ev-uuid-2',
        badgeId: 'badge-123',
        type: 'URL',
        sourceUrl: 'https://example.com/admin-evidence',
        fileName: '',
        originalName: 'example.com',
        fileSize: 0,
        mimeType: '',
        blobUrl: '',
        uploadedBy: 'admin-user',
        uploadedAt: new Date(),
      });

      const result = await service.addUrlEvidence(
        'badge-123',
        'https://example.com/admin-evidence',
        'admin-user',
        'ADMIN',
      );

      expect(result).toBeDefined();
      expect(result.type).toBe('URL');
    });
  });

  describe('listEvidence - unified (Story 12.5)', () => {
    const mockBadge = {
      id: 'badge-123',
      recipientId: 'user-123',
      issuerId: 'user-admin',
    };

    it('should return both FILE and URL type evidence', async () => {
      mockPrismaService.badge.findUnique.mockResolvedValue(mockBadge);
      mockPrismaService.evidenceFile.findMany.mockResolvedValue([
        {
          id: 'file-1',
          fileName: 'badge-123/cert.pdf',
          originalName: 'cert.pdf',
          fileSize: 12345,
          mimeType: 'application/pdf',
          blobUrl: 'https://storage.blob.core.windows.net/evidence/cert.pdf',
          uploadedAt: new Date(),
          type: 'FILE',
          sourceUrl: null,
        },
        {
          id: 'url-1',
          fileName: '',
          originalName: 'example.com',
          fileSize: 0,
          mimeType: '',
          blobUrl: '',
          uploadedAt: new Date(),
          type: 'URL',
          sourceUrl: 'https://example.com/evidence',
        },
      ]);

      const result = await service.listEvidence(
        'badge-123',
        'user-123',
        'EMPLOYEE',
      );

      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('FILE');
      expect(result[0].sourceUrl).toBeUndefined();
      expect(result[1].type).toBe('URL');
      expect(result[1].sourceUrl).toBe('https://example.com/evidence');
    });
  });
});
