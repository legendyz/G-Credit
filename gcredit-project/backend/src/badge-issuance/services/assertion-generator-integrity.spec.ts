import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AssertionGeneratorService } from './assertion-generator.service';

describe('AssertionGeneratorService - Integrity (Story 6.5)', () => {
  let service: AssertionGeneratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssertionGeneratorService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config: Record<string, any> = {
                APP_URL: 'http://localhost:3000',
                EMAIL_FROM: 'badges@gcredit.test',
                BADGE_SALT: 'test-salt',
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AssertionGeneratorService>(AssertionGeneratorService);
  });

  describe('computeAssertionHash()', () => {
    it('should generate consistent SHA-256 hash for same assertion', () => {
      const assertion = {
        '@context': 'https://w3id.org/openbadges/v2',
        type: 'Assertion',
        id: 'http://localhost:3000/api/badges/test-badge-id/assertion',
        badge: 'http://localhost:3000/api/badge-templates/test-template-id',
        recipient: {
          type: 'email',
          hashed: true,
          salt: 'test-salt',
          identity: 'sha256$abc123',
        },
        issuedOn: '2026-01-28T10:00:00.000Z',
        verification: {
          type: 'hosted',
          verificationUrl: 'http://localhost:3000/verify/test-verification-id',
        },
      };

      const hash1 = service.computeAssertionHash(assertion);
      const hash2 = service.computeAssertionHash(assertion);

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex = 64 chars
    });

    it('should generate different hash for modified assertion', () => {
      const assertion1 = {
        '@context': 'https://w3id.org/openbadges/v2',
        type: 'Assertion',
        id: 'http://localhost:3000/api/badges/badge-1/assertion',
        badge: 'http://localhost:3000/api/badge-templates/template-1',
        recipient: {
          type: 'email',
          hashed: true,
          salt: 'salt-1',
          identity: 'sha256$hash1',
        },
        issuedOn: '2026-01-28T10:00:00.000Z',
        verification: {
          type: 'hosted',
          verificationUrl: 'http://localhost:3000/verify/verify-id-1',
        },
      };

      const assertion2 = {
        ...assertion1,
        issuedOn: '2026-01-28T10:00:01.000Z', // 1 second difference
      };

      const hash1 = service.computeAssertionHash(assertion1);
      const hash2 = service.computeAssertionHash(assertion2);

      expect(hash1).not.toBe(hash2);
    });

    it('should detect tampering with recipient identity', () => {
      const originalAssertion = {
        '@context': 'https://w3id.org/openbadges/v2',
        type: 'Assertion',
        id: 'http://localhost:3000/api/badges/test-badge/assertion',
        badge: 'http://localhost:3000/api/badge-templates/test-template',
        recipient: {
          type: 'email',
          hashed: true,
          salt: 'salt',
          identity: 'sha256$original-hash',
        },
        issuedOn: '2026-01-28T10:00:00.000Z',
        verification: {
          type: 'hosted',
          verificationUrl: 'http://localhost:3000/verify/verify-id',
        },
      };

      const tamperedAssertion = {
        ...originalAssertion,
        recipient: {
          ...originalAssertion.recipient,
          identity: 'sha256$tampered-hash', // Changed
        },
      };

      const originalHash = service.computeAssertionHash(originalAssertion);
      const tamperedHash = service.computeAssertionHash(tamperedAssertion);

      expect(originalHash).not.toBe(tamperedHash);
    });

    it('should be sensitive to field order (JSON.stringify behavior)', () => {
      const assertion1 = {
        type: 'Assertion',
        id: 'test-id',
      };

      const assertion2 = {
        id: 'test-id',
        type: 'Assertion',
      };

      const hash1 = service.computeAssertionHash(assertion1);
      const hash2 = service.computeAssertionHash(assertion2);

      // JSON.stringify preserves field order, so hashes will differ
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyAssertionIntegrity()', () => {
    it('should return true when hashes match', () => {
      const assertion = {
        '@context': 'https://w3id.org/openbadges/v2',
        type: 'Assertion',
        id: 'http://localhost:3000/api/badges/test-badge/assertion',
        badge: 'http://localhost:3000/api/badge-templates/test-template',
        recipient: {
          type: 'email',
          hashed: true,
          salt: 'test-salt',
          identity: 'sha256$test-hash',
        },
        issuedOn: '2026-01-28T10:00:00.000Z',
        verification: {
          type: 'hosted',
          verificationUrl: 'http://localhost:3000/verify/test-verification-id',
        },
      };

      const storedHash = service.computeAssertionHash(assertion);
      const isValid = service.verifyAssertionIntegrity(assertion, storedHash);

      expect(isValid).toBe(true);
    });

    it('should return false when assertion has been tampered', () => {
      const originalAssertion = {
        '@context': 'https://w3id.org/openbadges/v2',
        type: 'Assertion',
        id: 'http://localhost:3000/api/badges/test-badge/assertion',
        badge: 'http://localhost:3000/api/badge-templates/test-template',
        recipient: {
          type: 'email',
          hashed: true,
          salt: 'test-salt',
          identity: 'sha256$original',
        },
        issuedOn: '2026-01-28T10:00:00.000Z',
        verification: {
          type: 'hosted',
          verificationUrl: 'http://localhost:3000/verify/test-verification-id',
        },
      };

      const storedHash = service.computeAssertionHash(originalAssertion);

      // Tamper with assertion
      const tamperedAssertion = {
        ...originalAssertion,
        recipient: {
          ...originalAssertion.recipient,
          identity: 'sha256$tampered',
        },
      };

      const isValid = service.verifyAssertionIntegrity(
        tamperedAssertion,
        storedHash,
      );

      expect(isValid).toBe(false);
    });

    it('should return false for completely different assertion', () => {
      const assertion1 = {
        '@context': 'https://w3id.org/openbadges/v2',
        type: 'Assertion',
        id: 'http://localhost:3000/api/badges/badge-1/assertion',
      };

      const assertion2 = {
        '@context': 'https://w3id.org/openbadges/v2',
        type: 'Assertion',
        id: 'http://localhost:3000/api/badges/badge-2/assertion',
      };

      const storedHash = service.computeAssertionHash(assertion1);
      const isValid = service.verifyAssertionIntegrity(assertion2, storedHash);

      expect(isValid).toBe(false);
    });
  });
});
