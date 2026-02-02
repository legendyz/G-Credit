import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailTemplateService } from './email-template.service';

describe('EmailTemplateService', () => {
  let service: EmailTemplateService;
  let configService: ConfigService;

  const mockConfigService = {
    get: (key: string, defaultValue?: string) => {
      const config = {
        PLATFORM_URL: 'https://test.g-credit.com',
        API_URL: 'https://api.test.g-credit.com',
      };
      return config[key] || defaultValue;
    },
  };

  const testBadgeData = {
    badgeId: 'test-badge-id',
    badgeImageUrl: 'https://example.com/badge.png',
    badgeName: 'Test Badge',
    badgeDescription: 'This is a test badge description',
    issuerName: 'Test Issuer',
    recipientName: 'John Doe',
    recipientEmail: 'john@example.com',
    issueDate: new Date('2026-01-30'),
    expiryDate: new Date('2027-01-30'),
    verificationId: 'test-verification-id',
    claimToken: 'test-claim-token',
    earnedCount: 123,
    personalMessage: 'Congrats on this achievement!',
    isShared: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailTemplateService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<EmailTemplateService>(EmailTemplateService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('renderHtml', () => {
    it('should render HTML email with all data', () => {
      const html = service.renderHtml(testBadgeData);

      expect(html).toContain('G-Credit');
      expect(html).toContain('Test Badge');
      expect(html).toContain('Test Issuer');
      expect(html).toContain('John Doe');
      expect(html).toContain('john@example.com');
      expect(html).toContain('Congrats on this achievement!');
      expect(html).toContain('Badge Shared With You');
      expect(html).toContain('123'); // earnedCount
      expect(html).toContain(
        'https://test.g-credit.com/verify/test-verification-id',
      );
      // Handlebars HTML-escapes URLs, so = becomes &#x3D;
      expect(html).toContain('https://test.g-credit.com/claim?token');
      expect(html).toContain('test-claim-token');
    });

    it('should render HTML without optional fields', () => {
      const minimalData = {
        badgeId: 'test-badge-id',
        badgeImageUrl: null,
        badgeName: 'Minimal Badge',
        badgeDescription: '',
        issuerName: 'Issuer',
        recipientName: 'Recipient',
        recipientEmail: 'recipient@example.com',
        issueDate: new Date('2026-01-30'),
        expiryDate: null,
        verificationId: 'verification-123',
        claimToken: null,
      };

      const html = service.renderHtml(minimalData);

      expect(html).toContain('Minimal Badge');
      expect(html).toContain('Issuer');
      expect(html).toContain('Recipient');
      expect(html).not.toContain('Claim Badge Now');
      expect(html).toContain('https://via.placeholder.com'); // Default image
    });

    it('should use platform URL from config', () => {
      const html = service.renderHtml(testBadgeData);

      expect(html).toContain('https://test.g-credit.com');
    });

    it('should format dates correctly', () => {
      const html = service.renderHtml(testBadgeData);

      expect(html).toContain('January 30, 2026'); // Issue date
      expect(html).toContain('January 30, 2027'); // Expiry date
    });
  });

  describe('renderText', () => {
    it('should render plain text email with all data', () => {
      const text = service.renderText(testBadgeData);

      expect(text).toContain('Badge Shared With You');
      expect(text).toContain('Test Badge');
      expect(text).toContain('Issued by Test Issuer');
      expect(text).toContain('John Doe');
      expect(text).toContain('Congrats on this achievement!');
      expect(text).toContain('123 professionals have earned this badge');
      expect(text).toContain(
        'https://test.g-credit.com/verify/test-verification-id',
      );
      expect(text).toContain(
        'https://test.g-credit.com/claim?token=test-claim-token',
      );
    });

    it('should render plain text without optional fields', () => {
      const minimalData = {
        badgeId: 'test-badge-id',
        badgeImageUrl: null,
        badgeName: 'Minimal Badge',
        badgeDescription: '',
        issuerName: 'Issuer',
        recipientName: 'Recipient',
        recipientEmail: 'recipient@example.com',
        issueDate: new Date('2026-01-30'),
        expiryDate: null,
        verificationId: 'verification-123',
        claimToken: null,
      };

      const text = service.renderText(minimalData);

      expect(text).toContain('Minimal Badge');
      expect(text).not.toContain('CLAIM YOUR BADGE');
      expect(text).not.toContain('professionals have earned');
    });

    it('should include footer links', () => {
      const text = service.renderText(testBadgeData);

      expect(text).toContain('G-Credit - Your Digital Credential Platform');
      expect(text).toContain('Help: https://test.g-credit.com/help');
      expect(text).toContain('Privacy: https://test.g-credit.com/privacy');
      expect(text).toContain('© 2026 G-Credit');
    });
  });

  describe('template loading', () => {
    it('should load templates on initialization', () => {
      expect(service).toBeDefined();
      // If templates didn't load, constructor would have thrown
    });
  });
});
