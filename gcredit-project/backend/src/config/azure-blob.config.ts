import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';

export const azureBlobConfig = {
  connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
  containerName: process.env.AZURE_STORAGE_CONTAINER_BADGES, // 'badges'
};

export const getBlobServiceClient = (): BlobServiceClient => {
  if (!azureBlobConfig.connectionString) {
    throw new Error('AZURE_STORAGE_CONNECTION_STRING is not configured');
  }

  return BlobServiceClient.fromConnectionString(
    azureBlobConfig.connectionString,
  );
};

export const getBadgesContainerClient = (): ContainerClient => {
  const blobServiceClient = getBlobServiceClient();

  if (!azureBlobConfig.containerName) {
    throw new Error('AZURE_STORAGE_CONTAINER_BADGES is not configured');
  }

  return blobServiceClient.getContainerClient(azureBlobConfig.containerName);
};
