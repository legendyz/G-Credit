import { Injectable, BadRequestException } from '@nestjs/common';
import { ContainerClient } from '@azure/storage-blob';
import { getBadgesContainerClient } from '../../config/azure-blob.config';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class BlobStorageService {
  private containerClient: ContainerClient;

  constructor() {
    this.containerClient = getBadgesContainerClient();
  }

  /**
   * Upload an image to Azure Blob Storage
   * @param file - Multer file object
   * @param folder - Folder name (e.g., 'templates', 'issued')
   * @returns Public URL of the uploaded image
   */
  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'templates',
  ): Promise<string> {
    // Validate image
    this.validateImage(file);

    // Generate unique filename
    const fileExtension = this.getFileExtension(file.originalname);
    const fileName = `${folder}/${uuidv4()}${fileExtension}`;

    // Get blob client
    const blockBlobClient = this.containerClient.getBlockBlobClient(fileName);

    // Upload to Azure Blob
    await blockBlobClient.upload(file.buffer, file.size, {
      blobHTTPHeaders: {
        blobContentType: file.mimetype,
        blobCacheControl: 'public, max-age=31536000', // Cache for 1 year
      },
    });

    return blockBlobClient.url;
  }

  /**
   * Delete an image from Azure Blob Storage
   * @param url - Full URL of the image
   */
  async deleteImage(url: string): Promise<void> {
    const blobName = this.extractBlobName(url);
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

    const exists = await blockBlobClient.exists();
    if (!exists) {
      throw new BadRequestException(`Image not found: ${url}`);
    }

    await blockBlobClient.delete();
  }

  /**
   * Check if an image exists
   * @param url - Full URL of the image
   */
  async imageExists(url: string): Promise<boolean> {
    try {
      const blobName = this.extractBlobName(url);
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      return await blockBlobClient.exists();
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate image file
   * @param file - Multer file object
   */
  private validateImage(file: Express.Multer.File): void {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    const maxSize = 2 * 1024 * 1024; // 2MB

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid image format. Only PNG and JPG images are allowed.',
      );
    }

    if (file.size > maxSize) {
      throw new BadRequestException(
        'Image size exceeds 2MB limit. Please upload a smaller image.',
      );
    }

    // Optional: Validate image dimensions (requires sharp library)
    // This can be added in Enhancement task
  }

  /**
   * Extract blob name from full URL
   * @param url - Full Azure Blob URL
   * @returns Blob name (path)
   */
  private extractBlobName(url: string): string {
    try {
      const urlObj = new URL(url);
      // Remove leading slash and container name
      const pathname = urlObj.pathname;
      const parts = pathname.split('/').filter(Boolean);
      
      // Remove container name (first part) and return rest
      if (parts.length > 1) {
        return parts.slice(1).join('/');
      }
      
      throw new Error('Invalid blob URL format');
    } catch (error) {
      throw new BadRequestException(`Invalid image URL: ${url}`);
    }
  }

  /**
   * Get file extension from filename
   * @param filename - Original filename
   * @returns Extension with dot (e.g., '.png')
   */
  private getFileExtension(filename: string): string {
    const parts = filename.split('.');
    if (parts.length > 1) {
      return `.${parts[parts.length - 1].toLowerCase()}`;
    }
    return '';
  }
}
