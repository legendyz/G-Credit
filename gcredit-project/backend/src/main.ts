import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

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

  // Validate configuration on startup
  validateTeamsConfiguration();

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
    .addTag('Badge Templates', 'Badge template management (CRUD, query, image upload)')
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
  console.log(`📚 API Documentation available at: http://localhost:${port}/api-docs`);
}
bootstrap();
