import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { BulkIssuanceService, SessionStatus } from './bulk-issuance.service';
import { CsvValidationService } from './csv-validation.service';
import { PrismaService } from '../common/prisma.service';

describe('BulkIssuanceService', () => {
  let service: BulkIssuanceService;
  let csvValidation: CsvValidationService;

  const mockPrismaService = {
    bulkIssuanceSession: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    badgeTemplate: {
      findFirst: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BulkIssuanceService,
        CsvValidationService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<BulkIssuanceService>(BulkIssuanceService);
    csvValidation = module.get<CsvValidationService>(CsvValidationService);

    // Default: valid template and user exist
    mockPrismaService.badgeTemplate.findFirst.mockResolvedValue({ id: 'template-123', name: 'template-123', status: 'ACTIVE' });
    mockPrismaService.user.findFirst.mockResolvedValue({ id: 'user-1', email: 'user@company.com', isActive: true });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateTemplate', () => {
    it('should generate a CSV template with example rows', () => {
      const template = service.generateTemplate();
      
      expect(template).toContain('badgeTemplateId,recipientEmail');
      expect(template).toContain('EXAMPLE-DELETE-THIS-ROW');
      expect(template).toContain('DELETE THIS EXAMPLE ROW BEFORE UPLOAD');
    });

    it('should include header comment warning', () => {
      const template = service.generateTemplate();
      
      expect(template).toContain('# DELETE THE EXAMPLE ROWS BELOW BEFORE UPLOAD');
    });

    it('should contain all required headers', () => {
      const template = service.generateTemplate();
      const lines = template.split('\n').filter(l => !l.startsWith('#'));
      const headerLine = lines[0];
      
      expect(headerLine).toContain('badgeTemplateId');
      expect(headerLine).toContain('recipientEmail');
      expect(headerLine).toContain('evidenceUrl');
      expect(headerLine).toContain('narrativeJustification');
    });

    it('should contain field documentation comments', () => {
      const template = service.generateTemplate();
      
      expect(template).toContain('# G-Credit Bulk Badge Issuance Template');
      expect(template).toContain('# Field Specifications:');
      expect(template).toContain('# badgeTemplateId');
      expect(template).toContain('# recipientEmail');
      expect(template).toContain('# evidenceUrl');
      expect(template).toContain('# narrativeJustification');
      expect(template).toContain('# Tips:');
      expect(template).toContain('Maximum 20 badges per upload');
    });

    it('should contain EXAMPLE-DELETE-THIS-ROW example rows', () => {
      const template = service.generateTemplate();
      const exampleLines = template.split('\n').filter(l => l.includes('EXAMPLE-DELETE-THIS-ROW'));
      
      expect(exampleLines.length).toBeGreaterThanOrEqual(2);
    });

    it('should use UTF-8 compatible format', () => {
      const template = service.generateTemplate();
      
      // Template should be a valid string (UTF-8 compatible)
      expect(typeof template).toBe('string');
      expect(template.length).toBeGreaterThan(0);
      // Should not contain any null bytes
      expect(template).not.toContain('\0');
    });
  });

  describe('createSession', () => {
    it('should create a session with valid CSV data', async () => {
      const csvContent = `badgeTemplateId,recipientEmail,evidenceUrl
template-123,user@company.com,https://example.com/evidence`;
      
      const result = await service.createSession(csvContent, 'issuer-123');
      
      expect(result.sessionId).toBeDefined();
      expect(result.validRows).toBe(1);
      expect(result.errorRows).toBe(0);
      expect(result.status).toBe(SessionStatus.VALIDATED);
    });

    it('should reject example rows', async () => {
      // Example data is caught by format check, before DB lookup
      mockPrismaService.badgeTemplate.findFirst.mockResolvedValue(null);
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      const csvContent = `badgeTemplateId,recipientEmail,evidenceUrl
EXAMPLE-DELETE-THIS-ROW,example-john@company.com,`;
      
      const result = await service.createSession(csvContent, 'issuer-123');
      
      expect(result.validRows).toBe(0);
      expect(result.errorRows).toBe(1);
      expect(result.errors[0].message).toContain('Example');
    });

    it('should reject invalid email format', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      
      const csvContent = `badgeTemplateId,recipientEmail
template-123,not-an-email`;
      
      const result = await service.createSession(csvContent, 'issuer-123');
      
      expect(result.validRows).toBe(0);
      expect(result.errorRows).toBe(1);
      expect(result.errors[0].message).toContain('Invalid email');
    });

    it('should throw error for missing required headers', async () => {
      const csvContent = `name,email
John,john@example.com`;
      
      await expect(service.createSession(csvContent, 'issuer-123'))
        .rejects.toThrow(BadRequestException);
    });

    it('should enforce max row count', async () => {
      const rows = Array.from({ length: 21 }, (_, i) =>
        `template-${i},user${i}@company.com`
      ).join('\n');
      const csvContent = `badgeTemplateId,recipientEmail\n${rows}`;
      
      await expect(service.createSession(csvContent, 'issuer-123'))
        .rejects.toThrow(/exceeding the maximum/);
    });

    it('should strip UTF-8 BOM before parsing', async () => {
      const csvContent = `\uFEFFbadgeTemplateId,recipientEmail\ntemplate-123,user@company.com`;
      
      const result = await service.createSession(csvContent, 'issuer-123');
      
      expect(result.validRows).toBe(1);
    });
  });

  describe('getPreviewData - IDOR Prevention', () => {
    it('should allow access to session owner', async () => {
      const csvContent = `badgeTemplateId,recipientEmail
template-123,user@company.com`;
      
      const session = await service.createSession(csvContent, 'owner-123');
      const preview = await service.getPreviewData(session.sessionId, 'owner-123');
      
      expect(preview.sessionId).toBe(session.sessionId);
    });

    it('should block access from non-owner (IDOR prevention)', async () => {
      const csvContent = `badgeTemplateId,recipientEmail
template-123,user@company.com`;
      
      const session = await service.createSession(csvContent, 'owner-123');
      
      await expect(service.getPreviewData(session.sessionId, 'attacker-456'))
        .rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException for non-existent session', async () => {
      await expect(service.getPreviewData('non-existent-session', 'user-123'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('confirmBulkIssuance - IDOR Prevention', () => {
    it('should allow confirmation by session owner', async () => {
      const csvContent = `badgeTemplateId,recipientEmail
template-123,user@company.com`;
      
      const session = await service.createSession(csvContent, 'owner-123');
      const result = await service.confirmBulkIssuance(session.sessionId, 'owner-123');
      
      expect(result.success).toBe(true);
      expect(result.processed).toBe(1);
    });

    it('should block confirmation from non-owner (IDOR prevention)', async () => {
      const csvContent = `badgeTemplateId,recipientEmail
template-123,user@company.com`;
      
      const session = await service.createSession(csvContent, 'owner-123');
      
      await expect(service.confirmBulkIssuance(session.sessionId, 'attacker-456'))
        .rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException for non-existent session', async () => {
      await expect(service.confirmBulkIssuance('non-existent-session', 'user-123'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('getErrorReportCsv', () => {
    it('should generate sanitized CSV error report', async () => {
      // Example data fails format check (no DB hit); injection data fails format check
      mockPrismaService.badgeTemplate.findFirst.mockResolvedValue(null);
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      const csvContent = `badgeTemplateId,recipientEmail
EXAMPLE-DELETE-THIS-ROW,example@company.com
=EVIL(),user@company.com`;
      
      const session = await service.createSession(csvContent, 'owner-123');
      const csv = await service.getErrorReportCsv(session.sessionId, 'owner-123');
      
      // CSV should be generated
      expect(csv).toContain('Row,BadgeTemplateId,RecipientEmail,Error');
    });

    it('should throw error for session without errors', async () => {
      const csvContent = `badgeTemplateId,recipientEmail
template-123,user@company.com`;
      
      const session = await service.createSession(csvContent, 'owner-123');
      
      await expect(service.getErrorReportCsv(session.sessionId, 'owner-123'))
        .rejects.toThrow(BadRequestException);
    });

    it('should block access from non-owner', async () => {
      mockPrismaService.badgeTemplate.findFirst.mockResolvedValue(null);
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      const csvContent = `badgeTemplateId,recipientEmail
EXAMPLE-DELETE,example@company.com`;
      
      const session = await service.createSession(csvContent, 'owner-123');
      
      await expect(service.getErrorReportCsv(session.sessionId, 'attacker-456'))
        .rejects.toThrow(ForbiddenException);
    });
  });
});
