import {
  Injectable,
  BadRequestException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
  aspectRatio: number;
  isOptimal: boolean;
  suggestions?: string[];
}

export interface UploadImageResult {
  url: string;
  thumbnailUrl?: string;
  metadata: ImageMetadata;
}

@Injectable()
export class BlobStorageService implements OnModuleInit {
  private readonly logger = new Logger(BlobStorageService.name);
  private containerClient: ContainerClient | null = null;

  // Recommended dimensions for badge images
  private readonly RECOMMENDED_SIZES = [256, 512, 1024];
  private readonly OPTIMAL_SIZES = [256, 512];
  private readonly MIN_DIMENSION = 128;
  private readonly MAX_DIMENSION = 2048;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const connectionString = this.configService.get<string>(
      'AZURE_STORAGE_CONNECTION_STRING',
    );
    const containerName = this.configService.get<string>(
      'AZURE_STORAGE_CONTAINER_BADGES',
      'badges',
    );

    if (!connectionString) {
      this.logger.warn(
        'Azure Blob Storage not configured - operations will return mock data',
      );
      return;
    }

    try {
      const blobServiceClient =
        BlobServiceClient.fromConnectionString(connectionString);
      this.containerClient =
        blobServiceClient.getContainerClient(containerName);
      this.logger.log('Azure Blob Storage (badges) connected successfully');
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to initialize Azure Blob Storage: ${errMsg}`);
      this.containerClient = null;
    }
  }

  private ensureClient(): ContainerClient {
    if (!this.containerClient) {
      throw new BadRequestException('Azure Blob Storage is not configured');
    }
    return this.containerClient;
  }

  /**
   * Check if Azure Blob Storage is available
   */
  isAvailable(): boolean {
    return this.containerClient !== null;
  }

  /**
   * Upload an image to Azure Blob Storage with validation and optimization
   * @param file - Multer file object
   * @param folder - Folder name (e.g., 'templates', 'issued')
   * @param generateThumbnail - Whether to generate a thumbnail (default: false)
   * @returns Upload result with URL, metadata, and optional thumbnail URL
   */
  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'templates',
    generateThumbnail: boolean = false,
  ): Promise<UploadImageResult> {
    // Validate image format and size
    this.validateImage(file);

    // Get image metadata
    const metadata = await this.getImageMetadata(file.buffer);

    // Validate dimensions
    this.validateDimensions(metadata);

    // Generate unique filename
    const fileExtension = this.getFileExtension(file.originalname);
    const fileName = `${folder}/${uuidv4()}${fileExtension}`;

    // Check if Azure Storage is available - return mock URL for test/CI environments
    if (!this.isAvailable()) {
      this.logger.warn(
        'Azure Storage not available - returning mock URL for image upload',
      );
      const mockUrl = `https://mock-storage.blob.core.windows.net/badges/${fileName}`;
      return {
        url: mockUrl,
        metadata,
        thumbnailUrl: generateThumbnail
          ? `https://mock-storage.blob.core.windows.net/badges/${folder}/thumbnails/${uuidv4()}${fileExtension}`
          : undefined,
      };
    }

    // Get blob client
    const blockBlobClient = this.containerClient!.getBlockBlobClient(fileName);

    // Upload to Azure Blob
    await blockBlobClient.upload(file.buffer, file.size, {
      blobHTTPHeaders: {
        blobContentType: file.mimetype,
        blobCacheControl: 'public, max-age=31536000', // Cache for 1 year
      },
      metadata: {
        width: metadata.width.toString(),
        height: metadata.height.toString(),
        format: metadata.format,
        originalName: Buffer.from(file.originalname).toString('base64'),
      },
    });

    const result: UploadImageResult = {
      url: blockBlobClient.url,
      metadata,
    };

    // Generate thumbnail if requested
    if (generateThumbnail) {
      try {
        result.thumbnailUrl = await this.generateThumbnail(
          file.buffer,
          folder,
          fileExtension,
        );
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Failed to generate thumbnail: ${errMsg}`);
      }
    }

    // Log optimization suggestions if any
    if (metadata.suggestions && metadata.suggestions.length > 0) {
      this.logger.log(
        `Image optimization suggestions: ${metadata.suggestions.join('; ')}`,
      );
    }

    return result;
  }

  /**
   * Delete an image from Azure Blob Storage
   * @param url - Full URL of the image
   */
  async deleteImage(url: string): Promise<void> {
    // Skip deletion if Azure Storage is not available (mock URLs)
    if (!this.isAvailable()) {
      this.logger.warn('Azure Storage not available - skipping image deletion');
      return;
    }

    const blobName = this.extractBlobName(url);
    const blockBlobClient = this.containerClient!.getBlockBlobClient(blobName);

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
    // Return true for mock URLs when storage is not available
    if (!this.isAvailable()) {
      return url.includes('mock-storage.blob.core.windows.net');
    }

    try {
      const blobName = this.extractBlobName(url);
      const blockBlobClient =
        this.containerClient!.getBlockBlobClient(blobName);
      return await blockBlobClient.exists();
    } catch (_error) {
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
  }

  /**
   * Get image metadata using sharp
   * @param buffer - Image buffer
   * @returns Image metadata with optimization suggestions
   */
  private async getImageMetadata(buffer: Buffer): Promise<ImageMetadata> {
    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();

      const width = metadata.width || 0;
      const height = metadata.height || 0;
      const aspectRatio = width / height;

      const suggestions: string[] = [];
      let isOptimal = true;

      // Check if dimensions are optimal
      if (
        !this.OPTIMAL_SIZES.includes(width) ||
        !this.OPTIMAL_SIZES.includes(height)
      ) {
        isOptimal = false;
        suggestions.push(
          `Recommended dimensions: ${this.OPTIMAL_SIZES.join('x')} or ${this.OPTIMAL_SIZES.join('x')} pixels (square images work best for badges)`,
        );
      }

      // Check aspect ratio (prefer square images)
      if (Math.abs(aspectRatio - 1) > 0.1) {
        suggestions.push(
          'Consider using square images (1:1 aspect ratio) for better display across different platforms',
        );
      }

      // Check if image is too small
      if (width < this.MIN_DIMENSION || height < this.MIN_DIMENSION) {
        suggestions.push(
          `Image dimensions too small. Minimum recommended: ${this.MIN_DIMENSION}x${this.MIN_DIMENSION} pixels`,
        );
      }

      // Check if image is unnecessarily large
      if (width > this.MAX_DIMENSION || height > this.MAX_DIMENSION) {
        suggestions.push(
          `Image dimensions too large. Maximum recommended: ${this.MAX_DIMENSION}x${this.MAX_DIMENSION} pixels`,
        );
      }

      return {
        width,
        height,
        format: metadata.format || 'unknown',
        size: buffer.length,
        aspectRatio: parseFloat(aspectRatio.toFixed(2)),
        isOptimal,
        suggestions: suggestions.length > 0 ? suggestions : undefined,
      };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Failed to read image metadata: ${errMsg}`);
    }
  }

  /**
   * Validate image dimensions
   * @param metadata - Image metadata
   */
  private validateDimensions(metadata: ImageMetadata): void {
    if (
      metadata.width < this.MIN_DIMENSION ||
      metadata.height < this.MIN_DIMENSION
    ) {
      throw new BadRequestException(
        `Image too small. Minimum dimensions: ${this.MIN_DIMENSION}x${this.MIN_DIMENSION} pixels. Current: ${metadata.width}x${metadata.height}`,
      );
    }

    if (
      metadata.width > this.MAX_DIMENSION ||
      metadata.height > this.MAX_DIMENSION
    ) {
      throw new BadRequestException(
        `Image too large. Maximum dimensions: ${this.MAX_DIMENSION}x${this.MAX_DIMENSION} pixels. Current: ${metadata.width}x${metadata.height}`,
      );
    }
  }

  /**
   * Generate thumbnail for the image
   * @param buffer - Original image buffer
   * @param folder - Folder name
   * @param extension - File extension
   * @returns Thumbnail URL
   */
  private async generateThumbnail(
    buffer: Buffer,
    folder: string,
    extension: string,
  ): Promise<string> {
    const thumbnailSize = 128;
    const thumbnailBuffer = await sharp(buffer)
      .resize(thumbnailSize, thumbnailSize, {
        fit: 'cover',
        position: 'center',
      })
      .toBuffer();

    const thumbnailFileName = `${folder}/thumbnails/${uuidv4()}${extension}`;

    // Return mock URL if storage is not available
    if (!this.isAvailable()) {
      return `https://mock-storage.blob.core.windows.net/badges/${thumbnailFileName}`;
    }

    const blockBlobClient =
      this.containerClient!.getBlockBlobClient(thumbnailFileName);

    await blockBlobClient.upload(thumbnailBuffer, thumbnailBuffer.length, {
      blobHTTPHeaders: {
        blobContentType: extension === '.png' ? 'image/png' : 'image/jpeg',
        blobCacheControl: 'public, max-age=31536000',
      },
    });

    return blockBlobClient.url;
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
    } catch (_error) {
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
