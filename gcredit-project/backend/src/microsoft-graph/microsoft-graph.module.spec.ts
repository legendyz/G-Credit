import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { MicrosoftGraphModule } from './microsoft-graph.module';
import { GraphTokenProviderService } from './services/graph-token-provider.service';
import { GraphEmailService } from './services/graph-email.service';
import { GraphTeamsService } from './services/graph-teams.service';
import { PrismaService } from '../common/prisma.service';
import { EmailService } from '../common/email.service';

describe('MicrosoftGraphModule', () => {
  let module: TestingModule;

  // Mock EmailService to avoid real SMTP dependencies
  const mockEmailService = {
    sendMail: jest.fn(),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [MicrosoftGraphModule, ConfigModule.forRoot()],
    })
      .overrideProvider(EmailService)
      .useValue(mockEmailService)
      .compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide GraphTokenProviderService', () => {
    const service = module.get<GraphTokenProviderService>(
      GraphTokenProviderService,
    );
    expect(service).toBeDefined();
  });

  it('should provide GraphEmailService', () => {
    const service = module.get<GraphEmailService>(GraphEmailService);
    expect(service).toBeDefined();
  });

  it('should provide GraphTeamsService', () => {
    const service = module.get<GraphTeamsService>(GraphTeamsService);
    expect(service).toBeDefined();
  });

  it('should export GraphTokenProviderService', () => {
    const exports = Reflect.getMetadata('exports', MicrosoftGraphModule);
    expect(exports).toContain(GraphTokenProviderService);
  });

  it('should export GraphEmailService', () => {
    const exports = Reflect.getMetadata('exports', MicrosoftGraphModule);
    expect(exports).toContain(GraphEmailService);
  });

  it('should export GraphTeamsService', () => {
    const exports = Reflect.getMetadata('exports', MicrosoftGraphModule);
    expect(exports).toContain(GraphTeamsService);
  });
});
