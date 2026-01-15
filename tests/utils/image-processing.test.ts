import { describe, it, expect, beforeEach, vi } from 'vitest';
import sharp from 'sharp';
import {
  resize,
  crop,
  optimize,
  convertFormat,
  getMetadata,
  resizeToSizes,
  type ResizeOptions,
  type CropRegion,
} from '../../src/utils/image-processing';

// Mock sharp
vi.mock('sharp');

describe('image-processing', () => {
  let mockSharp: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock sharp instance
    mockSharp = {
      resize: vi.fn().mockReturnThis(),
      extract: vi.fn().mockReturnThis(),
      png: vi.fn().mockReturnThis(),
      jpeg: vi.fn().mockReturnThis(),
      webp: vi.fn().mockReturnThis(),
      metadata: vi.fn(),
      toBuffer: vi.fn(),
    };

    vi.mocked(sharp).mockReturnValue(mockSharp as any);
  });

  describe('resize', () => {
    it('should resize image with default options', async () => {
      const inputBuffer = Buffer.from('test-image');
      const outputBuffer = Buffer.from('resized-image');
      mockSharp.toBuffer.mockResolvedValue(outputBuffer);

      const result = await resize(inputBuffer, 800, 600);

      expect(sharp).toHaveBeenCalledWith(inputBuffer);
      expect(mockSharp.resize).toHaveBeenCalledWith(800, 600, {
        fit: 'cover',
        position: 'center',
        background: '#000000',
      });
      expect(result).toBe(outputBuffer);
    });

    it('should resize image with custom options', async () => {
      const inputBuffer = Buffer.from('test-image');
      const outputBuffer = Buffer.from('resized-image');
      mockSharp.toBuffer.mockResolvedValue(outputBuffer);

      const options: ResizeOptions = {
        fit: 'contain',
        position: 'top',
        background: '#FFFFFF',
      };

      const result = await resize(inputBuffer, 800, 600, options);

      expect(mockSharp.resize).toHaveBeenCalledWith(800, 600, {
        fit: 'contain',
        position: 'top',
        background: '#FFFFFF',
      });
      expect(result).toBe(outputBuffer);
    });

    it('should throw error on resize failure', async () => {
      const inputBuffer = Buffer.from('test-image');
      mockSharp.toBuffer.mockRejectedValue(new Error('Invalid dimensions'));

      await expect(resize(inputBuffer, -1, 600)).rejects.toThrow(
        'Image resize failed: Invalid dimensions'
      );
    });
  });

  describe('crop', () => {
    it('should crop image to specified region', async () => {
      const inputBuffer = Buffer.from('test-image');
      const outputBuffer = Buffer.from('cropped-image');
      mockSharp.toBuffer.mockResolvedValue(outputBuffer);

      const region: CropRegion = {
        left: 100,
        top: 100,
        width: 200,
        height: 200,
      };

      const result = await crop(inputBuffer, region);

      expect(sharp).toHaveBeenCalledWith(inputBuffer);
      expect(mockSharp.extract).toHaveBeenCalledWith({
        left: 100,
        top: 100,
        width: 200,
        height: 200,
      });
      expect(result).toBe(outputBuffer);
    });

    it('should throw error on crop failure', async () => {
      const inputBuffer = Buffer.from('test-image');
      mockSharp.toBuffer.mockRejectedValue(new Error('Region out of bounds'));

      const region: CropRegion = {
        left: 10000,
        top: 10000,
        width: 200,
        height: 200,
      };

      await expect(crop(inputBuffer, region)).rejects.toThrow(
        'Image crop failed: Region out of bounds'
      );
    });
  });

  describe('optimize', () => {
    it('should optimize image with default quality', async () => {
      const inputBuffer = Buffer.from('test-image');
      const outputBuffer = Buffer.from('optimized-image');
      mockSharp.toBuffer.mockResolvedValue(outputBuffer);

      const result = await optimize(inputBuffer);

      expect(sharp).toHaveBeenCalledWith(inputBuffer);
      expect(mockSharp.png).toHaveBeenCalledWith({ quality: 80, compressionLevel: 9 });
      expect(result).toBe(outputBuffer);
    });

    it('should optimize image with custom quality', async () => {
      const inputBuffer = Buffer.from('test-image');
      const outputBuffer = Buffer.from('optimized-image');
      mockSharp.toBuffer.mockResolvedValue(outputBuffer);

      const result = await optimize(inputBuffer, 95);

      expect(mockSharp.png).toHaveBeenCalledWith({ quality: 95, compressionLevel: 9 });
      expect(result).toBe(outputBuffer);
    });

    it('should throw error on optimization failure', async () => {
      const inputBuffer = Buffer.from('test-image');
      mockSharp.toBuffer.mockRejectedValue(new Error('Compression failed'));

      await expect(optimize(inputBuffer)).rejects.toThrow(
        'Image optimization failed: Compression failed'
      );
    });
  });

  describe('convertFormat', () => {
    it('should convert to PNG format', async () => {
      const inputBuffer = Buffer.from('test-image');
      const outputBuffer = Buffer.from('converted-image');
      mockSharp.toBuffer.mockResolvedValue(outputBuffer);

      const result = await convertFormat(inputBuffer, 'png', 85);

      expect(sharp).toHaveBeenCalledWith(inputBuffer);
      expect(mockSharp.png).toHaveBeenCalledWith({ quality: 85 });
      expect(result).toBe(outputBuffer);
    });

    it('should convert to JPEG format', async () => {
      const inputBuffer = Buffer.from('test-image');
      const outputBuffer = Buffer.from('converted-image');
      mockSharp.toBuffer.mockResolvedValue(outputBuffer);

      const result = await convertFormat(inputBuffer, 'jpeg', 90);

      expect(mockSharp.jpeg).toHaveBeenCalledWith({ quality: 90 });
      expect(result).toBe(outputBuffer);
    });

    it('should convert to WebP format', async () => {
      const inputBuffer = Buffer.from('test-image');
      const outputBuffer = Buffer.from('converted-image');
      mockSharp.toBuffer.mockResolvedValue(outputBuffer);

      const result = await convertFormat(inputBuffer, 'webp', 85);

      expect(mockSharp.webp).toHaveBeenCalledWith({ quality: 85 });
      expect(result).toBe(outputBuffer);
    });

    it('should use default quality if not specified', async () => {
      const inputBuffer = Buffer.from('test-image');
      const outputBuffer = Buffer.from('converted-image');
      mockSharp.toBuffer.mockResolvedValue(outputBuffer);

      await convertFormat(inputBuffer, 'png');

      expect(mockSharp.png).toHaveBeenCalledWith({ quality: 90 });
    });

    it('should throw error on conversion failure', async () => {
      const inputBuffer = Buffer.from('test-image');
      mockSharp.toBuffer.mockRejectedValue(new Error('Invalid format'));

      await expect(convertFormat(inputBuffer, 'png')).rejects.toThrow(
        'Format conversion failed: Invalid format'
      );
    });
  });

  describe('getMetadata', () => {
    it('should return image metadata', async () => {
      const inputBuffer = Buffer.from('test-image');
      const mockMetadata = {
        width: 1920,
        height: 1080,
        format: 'png',
        space: 'srgb',
        channels: 4,
        hasAlpha: true,
      };
      mockSharp.metadata.mockResolvedValue(mockMetadata);

      const result = await getMetadata(inputBuffer);

      expect(sharp).toHaveBeenCalledWith(inputBuffer);
      expect(mockSharp.metadata).toHaveBeenCalled();
      expect(result).toEqual(mockMetadata);
    });

    it('should handle missing metadata fields with defaults', async () => {
      const inputBuffer = Buffer.from('test-image');
      mockSharp.metadata.mockResolvedValue({});

      const result = await getMetadata(inputBuffer);

      expect(result).toEqual({
        width: 0,
        height: 0,
        format: 'unknown',
        space: 'unknown',
        channels: 0,
        hasAlpha: false,
      });
    });

    it('should throw error on metadata read failure', async () => {
      const inputBuffer = Buffer.from('test-image');
      mockSharp.metadata.mockRejectedValue(new Error('Corrupted image'));

      await expect(getMetadata(inputBuffer)).rejects.toThrow(
        'Failed to read metadata: Corrupted image'
      );
    });
  });

  describe('resizeToSizes', () => {
    it('should resize image to multiple sizes', async () => {
      const inputBuffer = Buffer.from('test-image');
      const sizes = [
        { width: 100, height: 100 },
        { width: 200, height: 200 },
        { width: 300, height: 300 },
      ];

      const mockBuffers = [
        Buffer.from('100x100'),
        Buffer.from('200x200'),
        Buffer.from('300x300'),
      ];

      mockSharp.toBuffer
        .mockResolvedValueOnce(mockBuffers[0])
        .mockResolvedValueOnce(mockBuffers[1])
        .mockResolvedValueOnce(mockBuffers[2]);

      const result = await resizeToSizes(inputBuffer, sizes);

      expect(sharp).toHaveBeenCalledTimes(3);
      expect(result).toHaveLength(3);
      expect(result).toEqual(mockBuffers);
    });

    it('should handle empty sizes array', async () => {
      const inputBuffer = Buffer.from('test-image');
      const sizes: Array<{ width: number; height: number }> = [];

      const result = await resizeToSizes(inputBuffer, sizes);

      expect(result).toEqual([]);
    });

    it('should throw error if any resize fails', async () => {
      const inputBuffer = Buffer.from('test-image');
      const sizes = [
        { width: 100, height: 100 },
        { width: 200, height: 200 },
      ];

      mockSharp.toBuffer
        .mockResolvedValueOnce(Buffer.from('100x100'))
        .mockRejectedValueOnce(new Error('Resize failed'));

      await expect(resizeToSizes(inputBuffer, sizes)).rejects.toThrow(
        'Batch resize failed: Image resize failed: Resize failed'
      );
    });
  });
});
