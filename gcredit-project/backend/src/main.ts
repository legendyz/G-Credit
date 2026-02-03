import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

/**
 * Validate JWT_SECRET at startup (ARCH-P1-003)
 * Security requirement: JWT secret must be strong enough for production use
 *
 * @throws Error if JWT_SECRET is missing, too short, or a default value
 */
function validateJwtSecret(): void {
  const logger = new Logger('JwtValidation');
  const jwtSecret = process.env.JWT_SECRET;
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';
  const isTest = process.env.NODE_ENV === 'test';

  // Skip validation in test environment (tests use mock secrets)
  if (isTest) {
    logger.log('⏭️  JWT validation skipped in test environment');
    return;
  }

  // Check JWT_SECRET exists
  if (!jwtSecret) {
    const errorMsg =
      'JWT_SECRET environment variable is required. ' +
      "Generate a strong secret with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"";
    logger.error(`❌ ${errorMsg}`);
    throw new Error(errorMsg);
  }

  // Check minimum length (32 characters = 256 bits)
  if (jwtSecret.length < 32) {
    const errorMsg = `JWT_SECRET must be at least 32 characters for security (current: ${jwtSecret.length} chars)`;
    logger.error(`❌ ${errorMsg}`);
    throw new Error(errorMsg);
  }

  // Check for default/weak values (ARCH-P1-003: fail in ALL environments per AC2)
  const weakSecrets = [
    'your-secret-key-here',
    'secret',
    'jwt-secret',
    'changeme',
    '12345678901234567890123456789012',
  ];
  if (weakSecrets.some((weak) => jwtSecret.toLowerCase().includes(weak))) {
    const errorMsg =
      'JWT_SECRET cannot be a default/weak value. Generate a strong random secret.';
    logger.error(`❌ ${errorMsg}`);
    throw new Error(errorMsg);
  }

  // Validate JWT_REFRESH_SECRET similarly
  if (!jwtRefreshSecret) {
    const errorMsg =
      'JWT_REFRESH_SECRET environment variable is required for token rotation';
    logger.error(`❌ ${errorMsg}`);
    throw new Error(errorMsg);
  }

  if (jwtRefreshSecret.length < 32) {
    const errorMsg = `JWT_REFRESH_SECRET must be at least 32 characters (current: ${jwtRefreshSecret.length} chars)`;
    logger.error(`❌ ${errorMsg}`);
    throw new Error(errorMsg);
  }

  logger.log(
    `✅ JWT secrets validated (JWT_SECRET: ${jwtSecret.length} chars, JWT_REFRESH_SECRET: ${jwtRefreshSecret.length} chars)`,
  );
}

/**
 * Validate required Teams notification configuration
 * Story 7.4 Task 7
 */
function validateTeamsConfiguration() {
  const logger = new Logger('ConfigValidation');
  const teamsEnabled = process.env.ENABLE_TEAMS_NOTIFICATIONS === 'true';

  if (!teamsEnabled) {
    logger.warn('⚠️  Teams notifications are DISABLED');
    return;
  }

  logger.log('✅ Teams notifications are ENABLED');

  // Validate Graph API credentials
  const requiredGraphVars = [
    'GRAPH_TENANT_ID',
    'GRAPH_CLIENT_ID',
    'GRAPH_CLIENT_SECRET',
  ];

  const missingGraphVars = requiredGraphVars.filter(
    (varName) => !process.env[varName],
  );

  if (missingGraphVars.length > 0) {
    logger.error(
      `❌ Missing Microsoft Graph API configuration: ${missingGraphVars.join(', ')}`,
    );
    logger.error('   Teams notifications will fail without these credentials');
  }

  // Validate optional Teams channel settings (warn but don't fail)
  if (!process.env.DEFAULT_TEAMS_TEAM_ID) {
    logger.warn('⚠️  DEFAULT_TEAMS_TEAM_ID not set (optional)');
  }

  if (!process.env.DEFAULT_TEAMS_CHANNEL_ID) {
    logger.warn('⚠️  DEFAULT_TEAMS_CHANNEL_ID not set (optional)');
  }

  // Validate platform URL
  if (!process.env.PLATFORM_URL) {
    logger.warn('⚠️  PLATFORM_URL not set, using default');
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // ARCH-P1-003: Validate JWT secrets at startup (MUST be first validation)
  validateJwtSecret();

  // Validate Teams configuration on startup
  validateTeamsConfiguration();

  // ========================================
  // Security Hardening (Story 8.6)
  // ========================================

  // Helmet middleware - Security headers (SEC-P1-002, AC1)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"], // Swagger UI needs unsafe-inline
          imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
          connectSrc: [
            "'self'",
            'https://graph.microsoft.com',
            'https://*.blob.core.windows.net', // Azure Blob Storage
          ],
          fontSrc: ["'self'", 'https:', 'data:'],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          // Only add upgradeInsecureRequests in production (omit in dev to avoid issues)
          ...(process.env.NODE_ENV === 'production' && {
            upgradeInsecureRequests: [],
          }),
        },
      },
      // AC1: X-Frame-Options: DENY (default is SAMEORIGIN, override to DENY)
      frameguard: { action: 'deny' },
      // AC1: Referrer-Policy: no-referrer
      referrerPolicy: { policy: 'no-referrer' },
      // AC1: X-XSS-Protection: 1; mode=block (deprecated but required by AC1)
      xXssProtection: true,
      // AC1: Permissions-Policy (formerly Feature-Policy)
      // Note: helmet v8 doesn't have built-in permissionsPolicy, we add it manually below
      crossOriginEmbedderPolicy: false, // Allow embedding for badge widgets
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow cross-origin resource sharing
    }),
  );

  // AC1: Add Permissions-Policy header manually (helmet v8 doesn't include it)
  app.use((req: any, res: any, next: any) => {
    res.setHeader(
      'Permissions-Policy',
      'geolocation=(), microphone=(), camera=(), payment=(), usb=()',
    );
    next();
  });
  logger.log('✅ Helmet security headers configured (AC1 compliant)');

  // CORS Configuration (SEC-P1-003, AC2)
  const rawOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
    : ['http://localhost:5173', 'http://localhost:3000'];

  // AC2 Security: Block wildcard '*' when credentials are enabled
  // Wildcard + credentials is insecure and violates CORS spec
  const allowedOrigins = rawOrigins.filter((origin) => origin !== '*');
  if (rawOrigins.includes('*')) {
    logger.warn(
      '⚠️  SECURITY: Wildcard "*" in ALLOWED_ORIGINS is ignored when credentials are enabled',
    );
  }

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) {
        callback(null, true);
        return;
      }
      // AC2: Strict whitelist check - no wildcard allowed with credentials
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
    ],
    exposedHeaders: ['X-Total-Count', 'X-Page-Number'],
    maxAge: 3600, // Cache preflight for 1 hour
  });
  logger.log(`✅ CORS configured with origins: ${allowedOrigins.join(', ')}`);

  // Enable global validation pipe for class-validator DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error for extra properties
      transform: true, // Transform payloads to DTO instances
    }),
  );

  // Swagger API Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('G-Credit Digital Badge Platform API')
    .setDescription(
      'API documentation for G-Credit Digital Badge Management System. ' +
        'This platform enables organizations to create, issue, and manage digital badges.',
    )
    .setVersion('1.0')
    .addTag('Authentication', 'User authentication and authorization')
    .addTag(
      'Badge Templates',
      'Badge template management (CRUD, query, image upload)',
    )
    .addTag(
      'Badge Sharing',
      'Share badges to Teams and other platforms (Story 7.4)',
    )
    .addTag(
      'Badge Widget',
      'PUBLIC API - Embeddable badge widgets for external websites (Story 7.3)',
    )
    .addTag(
      'Teams Actions',
      'Handle Adaptive Card actions from Microsoft Teams (Story 7.4)',
    )
    .addTag('Skills', 'Skill management and categories')
    .addTag('Users', 'User profile and management')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Keep authorization token after page refresh
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'G-Credit API Documentation',
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(
    `📚 API Documentation available at: http://localhost:${port}/api-docs`,
  );
}
bootstrap();
