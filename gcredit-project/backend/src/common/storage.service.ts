import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';

@Injectable()
export class StorageService implements OnModuleInit {
  private blobServiceClient: BlobServiceClient;
  private badgesContainer: ContainerClient;
  private evidenceContainer: ContainerClient;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const connectionString = this.configService.get<string>(
      'AZURE_STORAGE_CONNECTION_STRING',
    );
    
    if (!connectionString) {
      console.warn('⚠️ Azure Storage connection string not configured');
      return;
    }

    try {
      this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
      
      const badgesContainerName = this.configService.get<string>(
        'AZURE_STORAGE_CONTAINER_BADGES',
        'badges',
      );
      const evidenceContainerName = this.configService.get<string>(
        'AZURE_STORAGE_CONTAINER_EVIDENCE',
        'evidence',
      );

      this.badgesContainer = this.blobServiceClient.getContainerClient(badgesContainerName);
      this.evidenceContainer = this.blobServiceClient.getContainerClient(evidenceContainerName);

      console.log('✅ Azure Storage connected successfully');
    } catch (error) {
      console.error('❌ Failed to connect to Azure Storage:', error.message);
    }
  }

  async uploadBadgeImage(
    fileName: string,
    fileBuffer: Buffer,
    contentType: string = 'image/png',
  ): Promise<string> {
    const blockBlobClient = this.badgesContainer.getBlockBlobClient(fileName);
    await blockBlobClient.upload(fileBuffer, fileBuffer.length, {
      blobHTTPHeaders: { blobContentType: contentType },
    });
    return blockBlobClient.url;
  }

  async uploadEvidence(
    fileName: string,
    fileBuffer: Buffer,
    contentType: string,
  ): Promise<string> {
    const blockBlobClient = this.evidenceContainer.getBlockBlobClient(fileName);
    await blockBlobClient.upload(fileBuffer, fileBuffer.length, {
      blobHTTPHeaders: { blobContentType: contentType },
    });
    return blockBlobClient.url;
  }

  async deleteBadgeImage(fileName: string): Promise<void> {
    const blockBlobClient = this.badgesContainer.getBlockBlobClient(fileName);
    await blockBlobClient.deleteIfExists();
  }

  async deleteEvidence(fileName: string): Promise<void> {
    const blockBlobClient = this.evidenceContainer.getBlockBlobClient(fileName);
    await blockBlobClient.deleteIfExists();
  }

  getBadgeImageUrl(fileName: string): string {
    return `https://${this.configService.get('AZURE_STORAGE_ACCOUNT_NAME')}.blob.core.windows.net/badges/${fileName}`;
  }
}
