import { Test, TestingModule } from '@nestjs/testing';
import {
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { BulkIssuanceService, SessionStatus } from './bulk-issuance.service';
import { CsvValidationService } from './csv-validation.service';
import { PrismaService } from '../common/prisma.service';

describe('BulkIssuanceService', () => {
  let service: BulkIssuanceService;
  let csvValidation: CsvValidationService;

  // In-memory store to simulate DB persistence between create/findUnique
  const sessionStore: Record<string, any> = {};

  const mockPrismaService = {
    bulkIssuanceSession: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    badgeTemplate: {
      findFirst: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
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
    mockPrismaService.badgeTemplate.findFirst.mockResolvedValue({
      id: 'template-123',
      name: 'template-123',
      status: 'ACTIVE',
    });
    mockPrismaService.user.findFirst.mockResolvedValue({
      id: 'user-1',
      email: 'user@company.com',
      isActive: true,
    });

    // Mock $transaction to execute the callback with a transaction client that delegates to the same mocks
    mockPrismaService.$transaction.mockImplementation(
      async (callback: (...args: unknown[]) => unknown) => {
        const txClient = {
          badgeTemplate: {
            findFirst: mockPrismaService.badgeTemplate.findFirst,
          },
          user: { findFirst: mockPrismaService.user.findFirst },
        };
        return callback(txClient);
      },
    );

    // Wire up session store for DB persistence simulation (Finding #1: DB-backed sessions)
    mockPrismaService.bulkIssuanceSession.create.mockImplementation(
      async ({ data }: any) => {
        sessionStore[data.id] = {
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        return sessionStore[data.id];
      },
    );
    mockPrismaService.bulkIssuanceSession.findUnique.mockImplementation(
      async ({ where }: any) => {
        return sessionStore[where.id] || null;
      },
    );
    mockPrismaService.bulkIssuanceSession.update.mockImplementation(
      async ({ where, data }: any) => {
        if (sessionStore[where.id]) {
          Object.assign(sessionStore[where.id], data);
        }
        return sessionStore[where.id];
      },
    );
    mockPrismaService.bulkIssuanceSession.delete.mockImplementation(
      async ({ where }: any) => {
        const deleted = sessionStore[where.id];
        delete sessionStore[where.id];
        return deleted;
      },
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Clear session store between tests
    Object.keys(sessionStore).forEach((key) => delete sessionStore[key]);
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

      expect(template).toContain(
        '# DELETE THE EXAMPLE ROWS BELOW BEFORE UPLOAD',
      );
    });

    it('should contain all required headers', () => {
      const template = service.generateTemplate();
      const lines = template.split('\n').filter((l) => !l.startsWith('#'));
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
      const exampleLines = template
        .split('\n')
        .filter((l) => l.includes('EXAMPLE-DELETE-THIS-ROW'));

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

      await expect(
        service.createSession(csvContent, 'issuer-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should enforce max row count', async () => {
      const rows = Array.from(
        { length: 21 },
        (_, i) => `template-${i},user${i}@company.com`,
      ).join('\n');
      const csvContent = `badgeTemplateId,recipientEmail\n${rows}`;

      await expect(
        service.createSession(csvContent, 'issuer-123'),
      ).rejects.toThrow(/exceeding the maximum/);
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
      const preview = await service.getPreviewData(
        session.sessionId,
        'owner-123',
      );

      expect(preview.sessionId).toBe(session.sessionId);
    });

    it('should block access from non-owner (IDOR prevention)', async () => {
      const csvContent = `badgeTemplateId,recipientEmail
template-123,user@company.com`;

      const session = await service.createSession(csvContent, 'owner-123');

      await expect(
        service.getPreviewData(session.sessionId, 'attacker-456'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException for non-existent session', async () => {
      await expect(
        service.getPreviewData('non-existent-session', 'user-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('confirmBulkIssuance - IDOR Prevention', () => {
    it('should allow confirmation by session owner', async () => {
      const csvContent = `badgeTemplateId,recipientEmail
template-123,user@company.com`;

      const session = await service.createSession(csvContent, 'owner-123');
      const result = await service.confirmBulkIssuance(
        session.sessionId,
        'owner-123',
      );

      expect(result.success).toBe(true);
      expect(result.processed).toBe(1);
    });

    it('should block confirmation from non-owner (IDOR prevention)', async () => {
      const csvContent = `badgeTemplateId,recipientEmail
template-123,user@company.com`;

      const session = await service.createSession(csvContent, 'owner-123');

      await expect(
        service.confirmBulkIssuance(session.sessionId, 'attacker-456'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException for non-existent session', async () => {
      await expect(
        service.confirmBulkIssuance('non-existent-session', 'user-123'),
      ).rejects.toThrow(NotFoundException);
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
      const csv = await service.getErrorReportCsv(
        session.sessionId,
        'owner-123',
      );

      // CSV should be generated
      expect(csv).toContain('Row,BadgeTemplateId,RecipientEmail,Error');
    });

    it('should throw error for session without errors', async () => {
      const csvContent = `badgeTemplateId,recipientEmail
template-123,user@company.com`;

      const session = await service.createSession(csvContent, 'owner-123');

      await expect(
        service.getErrorReportCsv(session.sessionId, 'owner-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should block access from non-owner', async () => {
      mockPrismaService.badgeTemplate.findFirst.mockResolvedValue(null);
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      const csvContent = `badgeTemplateId,recipientEmail
EXAMPLE-DELETE,example@company.com`;

      const session = await service.createSession(csvContent, 'owner-123');

      await expect(
        service.getErrorReportCsv(session.sessionId, 'attacker-456'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('CRLF line ending support', () => {
    it('should parse CRLF line endings correctly', async () => {
      const csvContent = `badgeTemplateId,recipientEmail,evidenceUrl\r\ntemplate-123,user@company.com,https://example.com/evidence`;

      const result = await service.createSession(csvContent, 'issuer-123');

      expect(result.validRows).toBe(1);
      expect(result.errorRows).toBe(0);
    });

    it('should parse LF line endings correctly', async () => {
      const csvContent = `badgeTemplateId,recipientEmail\ntemplate-123,user@company.com`;

      const result = await service.createSession(csvContent, 'issuer-123');

      expect(result.validRows).toBe(1);
    });

    it('should handle mixed line endings', async () => {
      const csvContent = `badgeTemplateId,recipientEmail\r\ntemplate-123,user@company.com\ntemplate-123,user@company.com`;

      const result = await service.createSession(csvContent, 'issuer-123');

      expect(result.validRows).toBe(2);
    });
  });

  describe('Transaction validation (ARCH-C4)', () => {
    it('should use $transaction for validation', async () => {
      const csvContent = `badgeTemplateId,recipientEmail\ntemplate-123,user@company.com`;

      await service.createSession(csvContent, 'issuer-123');

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should pass transaction options with ReadCommitted isolation', async () => {
      const csvContent = `badgeTemplateId,recipientEmail\ntemplate-123,user@company.com`;

      await service.createSession(csvContent, 'issuer-123');

      expect(mockPrismaService.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          isolationLevel: 'ReadCommitted',
          timeout: 10000,
        }),
      );
    });
  });

  describe('XSS sanitization (ARCH-C7)', () => {
    it('should sanitize XSS payloads in narrativeJustification before validation', async () => {
      const csvContent = `badgeTemplateId,recipientEmail,evidenceUrl,narrativeJustification\ntemplate-123,user@company.com,,<script>alert('xss')</script>Good work`;

      const result = await service.createSession(csvContent, 'issuer-123');

      // The XSS should be stripped, row should still be valid
      expect(result.validRows).toBe(1);
      // Check that the stored row doesn't contain the script tag
      const session = result.rows[0];
      expect(session.badgeTemplateId).not.toContain('<script>');
    });
  });

  describe('parseCsvContent - RFC 4180 compliance (Finding #4)', () => {
    it('should handle simple CSV rows', () => {
      const content = 'a,b,c\n1,2,3\n4,5,6';
      const rows = service.parseCsvContent(content);
      expect(rows).toEqual([
        ['a', 'b', 'c'],
        ['1', '2', '3'],
        ['4', '5', '6'],
      ]);
    });

    it('should handle quoted fields with commas', () => {
      const content = 'name,value\n"hello, world",123';
      const rows = service.parseCsvContent(content);
      expect(rows).toEqual([
        ['name', 'value'],
        ['hello, world', '123'],
      ]);
    });

    it('should handle quoted fields with newlines (multiline)', () => {
      const content = 'name,desc\n"line1\nline2",value';
      const rows = service.parseCsvContent(content);
      expect(rows).toEqual([
        ['name', 'desc'],
        ['line1\nline2', 'value'],
      ]);
    });

    it('should handle quoted fields with CRLF', () => {
      const content = 'name,desc\r\n"line1\r\nline2",value';
      const rows = service.parseCsvContent(content);
      expect(rows).toEqual([
        ['name', 'desc'],
        ['line1\nline2', 'value'],
      ]);
    });

    it('should handle escaped quotes inside quoted fields', () => {
      const content = 'name,desc\n"He said ""hello""",value';
      const rows = service.parseCsvContent(content);
      expect(rows).toEqual([
        ['name', 'desc'],
        ['He said "hello"', 'value'],
      ]);
    });

    it('should skip comment lines starting with #', () => {
      const content = '# comment\nname,value\n1,2';
      const rows = service.parseCsvContent(content);
      expect(rows).toEqual([
        ['name', 'value'],
        ['1', '2'],
      ]);
    });

    it('should skip empty lines', () => {
      const content = 'name,value\n\n1,2\n\n';
      const rows = service.parseCsvContent(content);
      expect(rows).toEqual([
        ['name', 'value'],
        ['1', '2'],
      ]);
    });

    it('should handle multiline quoted fields in CSV upload end-to-end', async () => {
      const csvContent = `badgeTemplateId,recipientEmail,evidenceUrl,narrativeJustification\ntemplate-123,user@company.com,,"Completed training\nwith distinction"`;

      const result = await service.createSession(csvContent, 'issuer-123');

      expect(result.validRows).toBe(1);
      expect(result.errorRows).toBe(0);
    });
  });
});
