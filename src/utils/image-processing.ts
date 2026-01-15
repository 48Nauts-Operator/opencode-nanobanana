/**
 * Image Processing Utility
 *
 * Handles image transformations using Sharp:
 * - Resizing
 * - Cropping
 * - Format conversion
 * - Optimization
 */

import sharp, { type Sharp } from 'sharp';

export interface ResizeOptions {
  /** Fit mode (cover, contain, fill, inside, outside) */
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  /** Position when fit is cover or contain */
  position?: string;
  /** Background color for contain */
  background?: string;
}

export interface CropRegion {
  /** Left position */
  left: number;
  /** Top position */
  top: number;
  /** Width */
  width: number;
  /** Height */
  height: number;
}

/**
 * Resize image to specified dimensions
 *
 * @param buffer Source image buffer
 * @param width Target width
 * @param height Target height
 * @param options Resize options
 * @returns Resized image buffer
 */
export async function resize(
  buffer: Buffer,
  width: number,
  height: number,
  options: ResizeOptions = {}
): Promise<Buffer> {
  try {
    const { fit = 'cover', position = 'center', background = '#000000' } = options;

    const resized = await sharp(buffer)
      .resize(width, height, {
        fit,
        position: position as any,
        background
      })
      .toBuffer();

    return resized;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Image resize failed: ${error.message}`);
    }
    throw new Error('Image resize failed');
  }
}

/**
 * Crop image to specified region
 *
 * @param buffer Source image buffer
 * @param region Crop region
 * @returns Cropped image buffer
 */
export async function crop(buffer: Buffer, region: CropRegion): Promise<Buffer> {
  try {
    const cropped = await sharp(buffer)
      .extract({
        left: region.left,
        top: region.top,
        width: region.width,
        height: region.height
      })
      .toBuffer();

    return cropped;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Image crop failed: ${error.message}`);
    }
    throw new Error('Image crop failed');
  }
}

/**
 * Optimize image quality
 *
 * @param buffer Source image buffer
 * @param quality Quality setting (1-100)
 * @returns Optimized image buffer
 */
export async function optimize(buffer: Buffer, quality: number = 80): Promise<Buffer> {
  try {
    const optimized = await sharp(buffer)
      .png({ quality, compressionLevel: 9 })
      .toBuffer();

    return optimized;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Image optimization failed: ${error.message}`);
    }
    throw new Error('Image optimization failed');
  }
}

/**
 * Convert image format
 *
 * @param buffer Source image buffer
 * @param format Target format (png, jpeg, webp)
 * @param quality Quality for lossy formats
 * @returns Converted image buffer
 */
export async function convertFormat(
  buffer: Buffer,
  format: 'png' | 'jpeg' | 'webp',
  quality: number = 90
): Promise<Buffer> {
  try {
    let pipeline: Sharp = sharp(buffer);

    switch (format) {
      case 'png':
        pipeline = pipeline.png({ quality });
        break;
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality });
        break;
      case 'webp':
        pipeline = pipeline.webp({ quality });
        break;
    }

    return await pipeline.toBuffer();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Format conversion failed: ${error.message}`);
    }
    throw new Error('Format conversion failed');
  }
}

/**
 * Get image metadata
 *
 * @param buffer Image buffer
 * @returns Metadata object with dimensions and format
 */
export async function getMetadata(buffer: Buffer): Promise<{
  width: number;
  height: number;
  format: string;
  space: string;
  channels: number;
  hasAlpha: boolean;
}> {
  try {
    const metadata = await sharp(buffer).metadata();

    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown',
      space: metadata.space || 'unknown',
      channels: metadata.channels || 0,
      hasAlpha: metadata.hasAlpha || false
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to read metadata: ${error.message}`);
    }
    throw new Error('Failed to read metadata');
  }
}

/**
 * Resize image to multiple sizes
 *
 * @param buffer Source image buffer
 * @param sizes Array of {width, height} objects
 * @returns Array of resized image buffers
 */
export async function resizeToSizes(
  buffer: Buffer,
  sizes: Array<{ width: number; height: number }>
): Promise<Buffer[]> {
  try {
    const resized = await Promise.all(
      sizes.map(({ width, height }) => resize(buffer, width, height))
    );

    return resized;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Batch resize failed: ${error.message}`);
    }
    throw new Error('Batch resize failed');
  }
}
