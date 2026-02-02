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
  let prismaService: PrismaService;
  let storageService: StorageService;

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
    prismaService = module.get<PrismaService>(PrismaService);
    storageService = module.get<StorageService>(StorageService);

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
      buffer: Buffer.from('test'),
      stream: null as any,
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

      const result = await service.uploadEvidence(
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

    it('should reject non-owner non-admin (AC 3.8)', async () => {
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
      mockStorageService.generateEvidenceSasUrl.mockResolvedValue({
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
      mockStorageService.generateEvidenceSasUrl.mockResolvedValue({
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
  });
});
