import { Test, TestingModule } from '@nestjs/testing';
import { CsvValidationService } from './csv-validation.service';

describe('CsvValidationService', () => {
  let service: CsvValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CsvValidationService],
    }).compile();

    service = module.get<CsvValidationService>(CsvValidationService);
  });

  describe('CSV Injection Prevention', () => {
    it('should sanitize formula injection with equals sign', () => {
      const malicious = "=cmd|'/c calc'!A1";
      const result = service.sanitizeCsvField(malicious);
      expect(result).toBe("'=cmd|'/c calc'!A1");
    });

    it('should sanitize plus prefix', () => {
      expect(service.sanitizeCsvField("+1+1")).toBe("'+1+1");
    });

    it('should sanitize minus prefix', () => {
      expect(service.sanitizeCsvField("-5+10")).toBe("'-5+10");
    });

    it('should sanitize at symbol prefix', () => {
      expect(service.sanitizeCsvField("@SUM(A1:A10)")).toBe("'@SUM(A1:A10)");
    });

    it('should sanitize tab prefix', () => {
      expect(service.sanitizeCsvField("\tdata")).toBe("'\tdata");
    });

    it('should sanitize carriage return prefix', () => {
      expect(service.sanitizeCsvField("\rdata")).toBe("'\rdata");
    });

    it('should not modify safe values', () => {
      expect(service.sanitizeCsvField("Normal text")).toBe("Normal text");
    });

    it('should not modify empty values', () => {
      expect(service.sanitizeCsvField("")).toBe("");
    });

    it('should not modify null values', () => {
      expect(service.sanitizeCsvField(null as any)).toBeNull();
    });

    it('should not modify numeric-looking strings', () => {
      expect(service.sanitizeCsvField("123456")).toBe("123456");
    });

    it('should not modify URLs', () => {
      expect(service.sanitizeCsvField("https://example.com")).toBe("https://example.com");
    });

    it('should handle complex injection attempts', () => {
      const attacks = [
        "=HYPERLINK(\"http://evil.com\",\"Click Me\")",
        "+cmd|'/c calc'!A0",
        "-cmd|'/c calc'!A0",
        "@sum(1+1)*1000",
      ];
      
      attacks.forEach(attack => {
        const result = service.sanitizeCsvField(attack);
        expect(result.startsWith("'")).toBe(true);
      });
    });
  });

  describe('sanitizeRow', () => {
    it('should sanitize all string fields in a row', () => {
      const row = {
        name: "=EVIL()",
        email: "normal@email.com",
        count: 5,
      };
      
      const result = service.sanitizeRow(row);
      
      expect(result.name).toBe("'=EVIL()");
      expect(result.email).toBe("normal@email.com");
      expect(result.count).toBe(5);
    });
  });

  describe('Example Data Detection', () => {
    it('should detect EXAMPLE- prefix', () => {
      expect(service.isExampleData("EXAMPLE-DELETE-THIS-ROW")).toBe(true);
    });

    it('should detect DELETE-THIS-ROW', () => {
      expect(service.isExampleData("some-DELETE-THIS-ROW-data")).toBe(true);
    });

    it('should detect example- prefix', () => {
      expect(service.isExampleData("example-john@company.com")).toBe(true);
    });

    it('should not flag normal data', () => {
      expect(service.isExampleData("template-abc123")).toBe(false);
    });
  });

  describe('validateBadgeTemplateId', () => {
    it('should reject example template IDs', () => {
      const result = service.validateBadgeTemplateId("EXAMPLE-DELETE-THIS-ROW");
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Example row detected');
    });

    it('should accept valid template IDs', () => {
      const result = service.validateBadgeTemplateId("abc123-def456-789");
      expect(result.valid).toBe(true);
    });

    it('should reject empty template IDs', () => {
      const result = service.validateBadgeTemplateId("");
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });
  });

  describe('validateEmail', () => {
    it('should reject example emails', () => {
      const result = service.validateEmail("example-john@company.com");
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Example email');
    });

    it('should reject @example.com emails', () => {
      const result = service.validateEmail("john@example.com");
      expect(result.valid).toBe(false);
    });

    it('should accept valid emails', () => {
      const result = service.validateEmail("john.doe@company.com");
      expect(result.valid).toBe(true);
    });

    it('should reject invalid email format', () => {
      const result = service.validateEmail("not-an-email");
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
      expect(csv).toContain("safe value");
    });

    it('should handle commas in values', () => {
      const headers = ['name'];
      const rows = [{ name: 'Doe, John' }];
      
      const csv = service.generateSafeCsv(headers, rows);
      
      expect(csv).toContain('"Doe, John"');
    });
  });
});
