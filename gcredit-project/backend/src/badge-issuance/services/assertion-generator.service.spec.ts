import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AssertionGeneratorService } from './assertion-generator.service';
import * as crypto from 'crypto';

describe('AssertionGeneratorService - Sprint 5 Story 6.1', () => {
  let service: AssertionGeneratorService;
  let _configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      const config = {
        APP_URL: 'https://g-credit.example.com',
        EMAIL_FROM: 'badges@gcredit.example.com',
        BADGE_SALT: 'test-salt-12345',
      };
      return config[key] || defaultValue;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssertionGeneratorService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AssertionGeneratorService>(AssertionGeneratorService);
    _configService = module.get<ConfigService>(ConfigService);
  });

  describe('generateAssertion()', () => {
    const mockTemplate = {
      id: 'template-uuid-123',
      name: 'Excellence Badge',
      description: 'For outstanding performance',
      imageUrl: 'https://cdn.example.com/badge.png',
      issuanceCriteria: { type: 'manual' },
    };

    const mockRecipient = {
      id: 'user-uuid-456',
      email: 'john.doe@example.com',
      name: 'John Doe',
    };

    const mockIssuer = {
      id: 'issuer-uuid-789',
      email: 'admin@gcredit.example.com',
      name: 'Admin User',
    };

    const mockIssuedAt = new Date('2026-01-28T10:30:00Z');

    it('should generate valid Open Badges 2.0 JSON-LD assertion', () => {
      // Arrange
      const params = {
        badgeId: 'badge-uuid-abc',
        verificationId: 'verification-uuid-def',
        template: mockTemplate,
        recipient: mockRecipient,
        issuer: mockIssuer,
        issuedAt: mockIssuedAt,
      };

      // Act
      const assertion = service.generateAssertion(params);

      // Assert - Check JSON-LD structure
      expect(assertion).toHaveProperty(
        '@context',
        'https://w3id.org/openbadges/v2',
      );
      expect(assertion).toHaveProperty('type', 'Assertion');
      expect(assertion).toHaveProperty(
        'id',
        'https://g-credit.example.com/api/badges/badge-uuid-abc/assertion',
      );

      // Badge should be URL string (NOT embedded object)
      expect(assertion.badge).toBe(
        'https://g-credit.example.com/api/badge-templates/template-uuid-123',
      );
      expect(typeof assertion.badge).toBe('string');

      // Recipient should be hashed
      expect(assertion.recipient).toHaveProperty('type', 'email');
      expect(assertion.recipient).toHaveProperty('hashed', true);
      expect(assertion.recipient).toHaveProperty('salt');
      expect(assertion.recipient).toHaveProperty('identity');
      expect(assertion.recipient.identity).toMatch(/^sha256\$/);

      // Issuance date
      expect(assertion.issuedOn).toBe('2026-01-28T10:30:00.000Z');

      // Verification (hosted type)
      expect(assertion.verification).toHaveProperty('type', 'hosted');
      expect(assertion.verification).toHaveProperty(
        'verificationUrl',
        'https://g-credit.example.com/verify/verification-uuid-def',
      );
    });

    it('should hash recipient email correctly with salt', () => {
      // Arrange
      const params = {
        badgeId: 'badge-uuid-abc',
        verificationId: 'verification-uuid-def',
        template: mockTemplate,
        recipient: mockRecipient,
        issuer: mockIssuer,
        issuedAt: mockIssuedAt,
      };

      // Expected hash calculation
      const salt = 'test-salt-12345';
      const expectedHash = crypto
        .createHash('sha256')
        .update('john.doe@example.com' + salt)
        .digest('hex');

      // Act
      const assertion = service.generateAssertion(params);

      // Assert
      expect(assertion.recipient.salt).toBe(salt);
      expect(assertion.recipient.identity).toBe(`sha256$${expectedHash}`);
      expect(assertion.recipient.hashed).toBe(true);
    });

    it('should handle optional fields (evidence, expires)', () => {
      // Arrange - Include all optional fields
      const mockExpiresAt = new Date('2027-01-28T10:30:00Z');
      const params = {
        badgeId: 'badge-uuid-abc',
        verificationId: 'verification-uuid-def',
        template: mockTemplate,
        recipient: mockRecipient,
        issuer: mockIssuer,
        issuedAt: mockIssuedAt,
        expiresAt: mockExpiresAt,
        evidenceUrls: [
          'https://blob.example.com/evidence1.pdf',
          'https://blob.example.com/evidence2.jpg',
        ],
      };

      // Act
      const assertion = service.generateAssertion(params);

      // Assert - Optional fields present
      expect(assertion.expires).toBe('2027-01-28T10:30:00.000Z');
      expect(assertion.evidence).toEqual([
        'https://blob.example.com/evidence1.pdf',
        'https://blob.example.com/evidence2.jpg',
      ]);
    });

    it('should omit optional fields when not provided', () => {
      // Arrange - No optional fields
      const params = {
        badgeId: 'badge-uuid-abc',
        verificationId: 'verification-uuid-def',
        template: mockTemplate,
        recipient: mockRecipient,
        issuer: mockIssuer,
        issuedAt: mockIssuedAt,
      };

      // Act
      const assertion = service.generateAssertion(params);

      // Assert - Optional fields not present
      expect(assertion).not.toHaveProperty('expires');
      expect(assertion).not.toHaveProperty('evidence');
    });

    it('should use verificationId in verification URL', () => {
      // Arrange - Different verification IDs
      const paramsA = {
        badgeId: 'badge-uuid-abc',
        verificationId: 'verification-123',
        template: mockTemplate,
        recipient: mockRecipient,
        issuer: mockIssuer,
        issuedAt: mockIssuedAt,
      };

      const paramsB = {
        ...paramsA,
        verificationId: 'verification-456',
      };

      // Act
      const assertionA = service.generateAssertion(paramsA);
      const assertionB = service.generateAssertion(paramsB);

      // Assert - Different verification URLs
      expect(assertionA.verification.verificationUrl).toBe(
        'https://g-credit.example.com/verify/verification-123',
      );
      expect(assertionB.verification.verificationUrl).toBe(
        'https://g-credit.example.com/verify/verification-456',
      );
      expect(assertionA.verification.verificationUrl).not.toBe(
        assertionB.verification.verificationUrl,
      );
    });
  });

  describe('hashEmail()', () => {
    it('should hash email with sha256 format', () => {
      // Arrange
      const email = 'test@example.com';
      const salt = 'test-salt-12345';
      const expectedHash = crypto
        .createHash('sha256')
        .update(email + salt)
        .digest('hex');

      // Act
      const result = service.hashEmail(email);

      // Assert
      expect(result).toBe(`sha256$${expectedHash}`);
      expect(result).toMatch(/^sha256\$/);
    });

    it('should lowercase email before hashing', () => {
      // Arrange
      const email = 'Test@Example.COM';
      const lowercaseEmail = 'test@example.com';

      // Act
      const result1 = service.hashEmail(email);
      const result2 = service.hashEmail(lowercaseEmail);

      // Assert - Same hash for different case
      expect(result1).toBe(result2);
    });
  });
});
