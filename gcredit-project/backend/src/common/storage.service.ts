import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BlobServiceClient,
  ContainerClient,
  BlobSASPermissions,
  generateBlobSASQueryParameters,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private blobServiceClient: BlobServiceClient;
  private badgesContainer: ContainerClient;
  private evidenceContainer: ContainerClient;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const connectionString = this.configService.get<string>(
      'AZURE_STORAGE_CONNECTION_STRING',
    );

    if (!connectionString) {
      this.logger.warn('Azure Storage connection string not configured');
      return;
    }

    try {
      this.blobServiceClient =
        BlobServiceClient.fromConnectionString(connectionString);

      const badgesContainerName = this.configService.get<string>(
        'AZURE_STORAGE_CONTAINER_BADGES',
        'badges',
      );
      const evidenceContainerName = this.configService.get<string>(
        'AZURE_STORAGE_CONTAINER_EVIDENCE',
        'evidence',
      );

      this.badgesContainer =
        this.blobServiceClient.getContainerClient(badgesContainerName);
      this.evidenceContainer = this.blobServiceClient.getContainerClient(
        evidenceContainerName,
      );

      this.logger.log('Azure Storage connected successfully');
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to connect to Azure Storage: ${errMsg}`);
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

  /**
   * Generate SAS token for evidence file download (Story 4.3 - AC 3.6)
   * 5-minute expiry, read-only permission
   */
  generateEvidenceSasUrl(fileName: string): { url: string; expiresAt: Date } {
    const accountName = this.configService.get<string>(
      'AZURE_STORAGE_ACCOUNT_NAME',
    );
    const accountKey = this.configService.get<string>(
      'AZURE_STORAGE_ACCOUNT_KEY',
    );

    if (!accountName || !accountKey) {
      throw new Error(
        'Azure Storage credentials not configured for SAS token generation',
      );
    }

    const sharedKeyCredential = new StorageSharedKeyCredential(
      accountName,
      accountKey,
    );
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5-minute expiry

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName: this.configService.get<string>(
          'AZURE_STORAGE_CONTAINER_EVIDENCE',
          'evidence',
        ),
        blobName: fileName,
        permissions: BlobSASPermissions.parse('r'), // Read-only
        expiresOn: expiresAt,
      },
      sharedKeyCredential,
    ).toString();

    const url = `https://${accountName}.blob.core.windows.net/${this.configService.get('AZURE_STORAGE_CONTAINER_EVIDENCE', 'evidence')}/${fileName}?${sasToken}`;

    return { url, expiresAt };
  }

  /**
   * Story 6.4: Download blob content as Buffer
   * Used for baked badge generation - downloads badge image from Azure
   */
  async downloadBlobBuffer(blobUrl: string): Promise<Buffer> {
    try {
      // Extract blob name from URL
      // URL format: https://{account}.blob.core.windows.net/{container}/{blobName}
      const url = new URL(blobUrl);
      const pathParts = url.pathname.split('/').filter(Boolean);

      if (pathParts.length < 2) {
        throw new Error(`Invalid blob URL format: ${blobUrl}`);
      }

      const containerName = pathParts[0];
      const blobName = pathParts.slice(1).join('/');

      const containerClient =
        this.blobServiceClient.getContainerClient(containerName);
      const blobClient = containerClient.getBlobClient(blobName);

      // Download blob to buffer
      const downloadResponse = await blobClient.download();
      const chunks: Buffer[] = [];

      for await (const chunk of downloadResponse.readableStreamBody!) {
        chunks.push(Buffer.from(chunk));
      }

      return Buffer.concat(chunks);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to download blob: ${errMsg}`);
    }
  }
}
