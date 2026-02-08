import { Test, TestingModule } from '@nestjs/testing';
import { CsvValidationService } from './csv-validation.service';
import { PrismaService } from '../common/prisma.service';

describe('CsvValidationService', () => {
  let service: CsvValidationService;

  const mockPrismaService = {
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
        CsvValidationService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CsvValidationService>(CsvValidationService);

    // Default mocks
    mockPrismaService.badgeTemplate.findFirst.mockResolvedValue({
      id: 'tpl-1',
      name: 'leadership-excellence',
      status: 'ACTIVE',
    });
    mockPrismaService.user.findFirst.mockResolvedValue({
      id: 'u-1',
      email: 'john@company.com',
      isActive: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('CSV Injection Prevention', () => {
    it('should sanitize formula injection with equals sign', () => {
      const malicious = "=cmd|'/c calc'!A1";
      const result = service.sanitizeCsvField(malicious);
      expect(result).toBe("'=cmd|'/c calc'!A1");
    });

    it('should sanitize plus prefix', () => {
      expect(service.sanitizeCsvField('+1+1')).toBe("'+1+1");
    });

    it('should sanitize minus prefix', () => {
      expect(service.sanitizeCsvField('-5+10')).toBe("'-5+10");
    });

    it('should sanitize at symbol prefix', () => {
      expect(service.sanitizeCsvField('@SUM(A1:A10)')).toBe("'@SUM(A1:A10)");
    });

    it('should sanitize tab prefix', () => {
      expect(service.sanitizeCsvField('\tdata')).toBe("'\tdata");
    });

    it('should sanitize carriage return prefix', () => {
      expect(service.sanitizeCsvField('\rdata')).toBe("'\rdata");
    });

    it('should not modify safe values', () => {
      expect(service.sanitizeCsvField('Normal text')).toBe('Normal text');
    });

    it('should not modify empty values', () => {
      expect(service.sanitizeCsvField('')).toBe('');
    });

    it('should not modify null values', () => {
      expect(service.sanitizeCsvField(null!)).toBeNull();
    });

    it('should not modify numeric-looking strings', () => {
      expect(service.sanitizeCsvField('123456')).toBe('123456');
    });

    it('should not modify URLs', () => {
      expect(service.sanitizeCsvField('https://example.com')).toBe(
        'https://example.com',
      );
    });

    it('should handle complex injection attempts', () => {
      const attacks = [
        '=HYPERLINK("http://evil.com","Click Me")',
        "+cmd|'/c calc'!A0",
        "-cmd|'/c calc'!A0",
        '@sum(1+1)*1000',
      ];

      attacks.forEach((attack) => {
        const result = service.sanitizeCsvField(attack);
        expect(result.startsWith("'")).toBe(true);
      });
    });
  });

  describe('sanitizeRow', () => {
    it('should sanitize all string fields in a row', () => {
      const row = {
        name: '=EVIL()',
        email: 'normal@email.com',
        count: 5,
      };

      const result = service.sanitizeRow(row);

      expect(result.name).toBe("'=EVIL()");
      expect(result.email).toBe('normal@email.com');
      expect(result.count).toBe(5);
    });
  });

  describe('Example Data Detection', () => {
    it('should detect EXAMPLE- prefix', () => {
      expect(service.isExampleData('EXAMPLE-DELETE-THIS-ROW')).toBe(true);
    });

    it('should detect DELETE-THIS-ROW', () => {
      expect(service.isExampleData('some-DELETE-THIS-ROW-data')).toBe(true);
    });

    it('should detect example- prefix', () => {
      expect(service.isExampleData('example-john@company.com')).toBe(true);
    });

    it('should not flag normal data', () => {
      expect(service.isExampleData('template-abc123')).toBe(false);
    });
  });

  describe('validateBadgeTemplateId', () => {
    it('should reject example template IDs', () => {
      const result = service.validateBadgeTemplateId('EXAMPLE-DELETE-THIS-ROW');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Example row detected');
    });

    it('should accept valid template IDs', () => {
      const result = service.validateBadgeTemplateId('abc123-def456-789');
      expect(result.valid).toBe(true);
    });

    it('should reject empty template IDs', () => {
      const result = service.validateBadgeTemplateId('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });
  });

  describe('validateEmail', () => {
    it('should reject example emails', () => {
      const result = service.validateEmail('example-john@company.com');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Example email');
    });

    it('should reject @example.com emails', () => {
      const result = service.validateEmail('john@example.com');
      expect(result.valid).toBe(false);
    });

    it('should accept valid emails', () => {
      const result = service.validateEmail('john.doe@company.com');
      expect(result.valid).toBe(true);
    });

    it('should reject invalid email format', () => {
      const result = service.validateEmail('not-an-email');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid email format');
    });
  });

  describe('generateSafeCsv', () => {
    it('should produce sanitized CSV output', () => {
      const headers = ['name', 'formula'];
      const rows = [
        { name: 'John', formula: '=SUM(A1:A10)' },
        { name: 'Jane', formula: 'safe value' },
      ];

      const csv = service.generateSafeCsv(headers, rows);

      expect(csv).toContain("'=SUM(A1:A10)");
      expect(csv).toContain('safe value');
    });

    it('should handle commas in values', () => {
      const headers = ['name'];
      const rows = [{ name: 'Doe, John' }];

      const csv = service.generateSafeCsv(headers, rows);

      expect(csv).toContain('"Doe, John"');
    });
  });

  describe('validateEvidenceUrl', () => {
    it('should return valid for null value', () => {
      const result = service.validateEvidenceUrl(null);
      expect(result.valid).toBe(true);
    });

    it('should return valid for empty string', () => {
      const result = service.validateEvidenceUrl('');
      expect(result.valid).toBe(true);
    });

    it('should accept valid HTTP URL', () => {
      const result = service.validateEvidenceUrl('http://example.com/evidence');
      expect(result.valid).toBe(true);
    });

    it('should accept valid HTTPS URL', () => {
      const result = service.validateEvidenceUrl(
        'https://company.com/docs/evidence.pdf',
      );
      expect(result.valid).toBe(true);
    });

    it('should reject invalid URL format', () => {
      const result = service.validateEvidenceUrl('not-a-url');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('HTTP/HTTPS URL');
    });

    it('should reject ftp URL', () => {
      const result = service.validateEvidenceUrl(
        'ftp://files.example.com/doc.pdf',
      );
      expect(result.valid).toBe(false);
      expect(result.error).toContain('HTTP/HTTPS URL');
    });
  });

  describe('validateNotes', () => {
    it('should return valid for null value', () => {
      const result = service.validateNotes(null);
      expect(result.valid).toBe(true);
    });

    it('should accept valid text under 500 chars', () => {
      const result = service.validateNotes(
        'This is a valid note for badge issuance.',
      );
      expect(result.valid).toBe(true);
    });

    it('should accept text exactly 500 chars', () => {
      const text = 'a'.repeat(500);
      const result = service.validateNotes(text);
      expect(result.valid).toBe(true);
    });

    it('should reject text exceeding 500 chars', () => {
      const text = 'a'.repeat(501);
      const result = service.validateNotes(text);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('500 character limit');
      expect(result.error).toContain('501');
    });
  });

  describe('validateRow', () => {
    it('should validate a row with all valid fields', async () => {
      const result = await service.validateRow({
        badgeTemplateId: 'leadership-excellence',
        recipientEmail: 'john@company.com',
        evidenceUrl: 'https://docs.company.com/evidence',
        narrativeJustification: 'Great leadership demonstrated',
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject row with missing badgeTemplateId', async () => {
      const result = await service.validateRow({
        badgeTemplateId: '',
        recipientEmail: 'john@company.com',
        evidenceUrl: '',
        narrativeJustification: '',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('required');
    });

    it('should reject row with invalid email', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      const result = await service.validateRow({
        badgeTemplateId: 'template-123',
        recipientEmail: 'not-an-email',
        evidenceUrl: '',
        narrativeJustification: '',
      });
      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e) => e.includes('email') || e.includes('Email')),
      ).toBe(true);
    });

    it('should reject row with invalid URL', async () => {
      const result = await service.validateRow({
        badgeTemplateId: 'template-123',
        recipientEmail: 'john@company.com',
        evidenceUrl: 'ftp://invalid',
        narrativeJustification: '',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('URL'))).toBe(true);
    });

    it('should reject row with narrativeJustification too long', async () => {
      const result = await service.validateRow({
        badgeTemplateId: 'template-123',
        recipientEmail: 'john@company.com',
        evidenceUrl: '',
        narrativeJustification: 'a'.repeat(501),
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('500'))).toBe(true);
    });

    it('should collect multiple errors from a single row', async () => {
      mockPrismaService.badgeTemplate.findFirst.mockResolvedValue(null);
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      const result = await service.validateRow({
        badgeTemplateId: '',
        recipientEmail: 'not-an-email',
        evidenceUrl: 'ftp://bad',
        narrativeJustification: 'a'.repeat(501),
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('validateBadgeTemplateIdInDb', () => {
    it('should return valid when template exists with ACTIVE status', async () => {
      const result = await service.validateBadgeTemplateIdInDb('template-123');
      expect(result.valid).toBe(true);
    });

    it('should return invalid when template not found', async () => {
      mockPrismaService.badgeTemplate.findFirst.mockResolvedValue(null);
      const result = await service.validateBadgeTemplateIdInDb('nonexistent');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should reject example template IDs before DB check', async () => {
      const result = await service.validateBadgeTemplateIdInDb(
        'EXAMPLE-DELETE-THIS-ROW',
      );
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Example');
    });
  });

  describe('validateRegisteredEmail', () => {
    it('should return valid when user exists and is active', async () => {
      const result = await service.validateRegisteredEmail('john@company.com');
      expect(result.valid).toBe(true);
    });

    it('should return invalid when user not found', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      const result = await service.validateRegisteredEmail(
        'unknown@company.com',
      );
      expect(result.valid).toBe(false);
      expect(result.error).toContain('No active registered user');
    });

    it('should reject example emails before DB check', async () => {
      const result = await service.validateRegisteredEmail(
        'example-john@company.com',
      );
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Example');
    });
  });

  describe('sanitizeTextInput (ARCH-C7 XSS Prevention)', () => {
    it('should strip script tags from text', () => {
      const result = service.sanitizeTextInput("<script>alert('xss')</script>");
      expect(result).toBe('');
    });

    it('should strip HTML tags and preserve text content', () => {
      const result = service.sanitizeTextInput('<b>bold</b> text');
      expect(result).toBe('bold text');
    });

    it('should handle nested HTML with script', () => {
      const result = service.sanitizeTextInput('<div><script>x</script></div>');
      expect(result).toBe('');
    });

    it('should preserve clean text without modification', () => {
      const result = service.sanitizeTextInput(
        'This is clean text with no HTML',
      );
      expect(result).toBe('This is clean text with no HTML');
    });

    it('should handle null/empty safely', () => {
      expect(service.sanitizeTextInput('')).toBe('');
      expect(service.sanitizeTextInput(null!)).toBeNull();
    });
  });

  describe('validateRowInTransaction (ARCH-C4)', () => {
    it('should validate valid row within transaction', async () => {
      const txClient = {
        badgeTemplate: {
          findFirst: jest
            .fn()
            .mockResolvedValue({ id: 'tpl-1', status: 'ACTIVE' }),
        },
        user: {
          findFirst: jest.fn().mockResolvedValue({ id: 'u-1', isActive: true }),
        },
      };

      const result = await service.validateRowInTransaction(
        {
          badgeTemplateId: 'leadership-excellence',
          recipientEmail: 'john@company.com',
          evidenceUrl: 'https://docs.example.com',
          narrativeJustification: 'Great work',
        },
        txClient,
      );

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should use transaction client for DB queries', async () => {
      const txClient = {
        badgeTemplate: {
          findFirst: jest
            .fn()
            .mockResolvedValue({ id: 'tpl-1', status: 'ACTIVE' }),
        },
        user: {
          findFirst: jest.fn().mockResolvedValue({ id: 'u-1', isActive: true }),
        },
      };

      await service.validateRowInTransaction(
        {
          badgeTemplateId: 'tpl-1',
          recipientEmail: 'john@company.com',
          evidenceUrl: '',
          narrativeJustification: '',
        },
        txClient,
      );

      expect(txClient.badgeTemplate.findFirst).toHaveBeenCalled();
      expect(txClient.user.findFirst).toHaveBeenCalled();
    });

    it('should reject invalid template in transaction', async () => {
      const txClient = {
        badgeTemplate: { findFirst: jest.fn().mockResolvedValue(null) },
        user: {
          findFirst: jest.fn().mockResolvedValue({ id: 'u-1', isActive: true }),
        },
      };

      const result = await service.validateRowInTransaction(
        {
          badgeTemplateId: 'nonexistent',
          recipientEmail: 'john@company.com',
          evidenceUrl: '',
          narrativeJustification: '',
        },
        txClient,
      );

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('not found'))).toBe(true);
    });

    it('should reject invalid email in transaction', async () => {
      const txClient = {
        badgeTemplate: {
          findFirst: jest
            .fn()
            .mockResolvedValue({ id: 'tpl-1', status: 'ACTIVE' }),
        },
        user: { findFirst: jest.fn().mockResolvedValue(null) },
      };

      const result = await service.validateRowInTransaction(
        {
          badgeTemplateId: 'tpl-1',
          recipientEmail: 'unknown@company.com',
          evidenceUrl: '',
          narrativeJustification: '',
        },
        txClient,
      );

      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e) => e.includes('No active registered user')),
      ).toBe(true);
    });

    it('should reject example data in transaction', async () => {
      const txClient = {
        badgeTemplate: { findFirst: jest.fn() },
        user: { findFirst: jest.fn() },
      };

      const result = await service.validateRowInTransaction(
        {
          badgeTemplateId: 'EXAMPLE-DELETE-THIS-ROW',
          recipientEmail: 'example-john@company.com',
          evidenceUrl: '',
          narrativeJustification: '',
        },
        txClient,
      );

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Example'))).toBe(true);
    });

    it('should collect multiple errors in transaction', async () => {
      const txClient = {
        badgeTemplate: { findFirst: jest.fn().mockResolvedValue(null) },
        user: { findFirst: jest.fn().mockResolvedValue(null) },
      };

      const result = await service.validateRowInTransaction(
        {
          badgeTemplateId: '',
          recipientEmail: 'not-an-email',
          evidenceUrl: 'ftp://bad',
          narrativeJustification: 'a'.repeat(501),
        },
        txClient,
      );

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });
  });
});
