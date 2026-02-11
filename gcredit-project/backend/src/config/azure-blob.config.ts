import { Logger } from '@nestjs/common';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';

const logger = new Logger('AzureBlobConfig');

export const azureBlobConfig = {
  connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
  containerName: process.env.AZURE_STORAGE_CONTAINER_BADGES, // 'badges'
};

export const getBlobServiceClient = (): BlobServiceClient | null => {
  if (!azureBlobConfig.connectionString) {
    logger.warn(
      'AZURE_STORAGE_CONNECTION_STRING is not configured - blob storage operations will be mocked',
    );
    return null;
  }

  return BlobServiceClient.fromConnectionString(
    azureBlobConfig.connectionString,
  );
};

export const getBadgesContainerClient = (): ContainerClient | null => {
  const blobServiceClient = getBlobServiceClient();

  if (!blobServiceClient) {
    return null;
  }

  if (!azureBlobConfig.containerName) {
    logger.warn('AZURE_STORAGE_CONTAINER_BADGES is not configured');
    return null;
  }

  return blobServiceClient.getContainerClient(azureBlobConfig.containerName);
};
