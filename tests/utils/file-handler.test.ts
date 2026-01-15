import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync } from 'fs';
import {
  saveImage,
  saveVideo,
  loadImage,
  ensureDirectory,
  generateFilename,
  getOutputDir,
} from '../../src/utils/file-handler';

// Mock fs module
vi.mock('fs/promises');
vi.mock('fs');

describe('file-handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateFilename', () => {
    it('should sanitize prompt to valid filename', () => {
      const result = generateFilename('Create a beautiful sunset image!');
      expect(result).toBe('create_a_beautiful_sunset_image');
    });

    it('should limit filename to 50 characters', () => {
      const longPrompt = 'a'.repeat(100);
      const result = generateFilename(longPrompt);
      expect(result.length).toBeLessThanOrEqual(50);
    });

    it('should replace spaces with underscores', () => {
      const result = generateFilename('hello world test');
      expect(result).toBe('hello_world_test');
    });

    it('should remove special characters', () => {
      const result = generateFilename('test@#$%^&*()image');
      expect(result).toBe('testimage');
    });

    it('should convert to lowercase', () => {
      const result = generateFilename('UPPERCASE TEST');
      expect(result).toBe('uppercase_test');
    });

    it('should handle empty prompt with default', () => {
      const result = generateFilename('!!!');
      expect(result).toBe('image');
    });

    it('should remove leading and trailing underscores', () => {
      const result = generateFilename('___test___');
      expect(result).toBe('test');
    });
  });

  describe('getOutputDir', () => {
    it('should return environment variable if set', () => {
      process.env.OUTPUT_DIR = './custom-output';
      const result = getOutputDir();
      expect(result).toBe('./custom-output');
    });

    it('should return default if environment variable not set', () => {
      delete process.env.OUTPUT_DIR;
      const result = getOutputDir();
      expect(result).toBe('./generated-assets');
    });
  });

  describe('ensureDirectory', () => {
    it('should create directory if not exists', async () => {
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);

      await ensureDirectory('./test-dir');

      expect(fs.mkdir).toHaveBeenCalledWith('./test-dir', { recursive: true });
    });

    it('should throw error if directory creation fails', async () => {
      vi.mocked(fs.mkdir).mockRejectedValue(new Error('Permission denied'));

      await expect(ensureDirectory('./test-dir')).rejects.toThrow(
        'Failed to create directory ./test-dir: Permission denied'
      );
    });
  });

  describe('saveImage', () => {
    beforeEach(() => {
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.mocked(existsSync).mockReturnValue(false);
    });

    it('should save image with sanitized filename', async () => {
      const buffer = Buffer.from('test-image');
      const outputDir = './test-output';
      const prompt = 'Test Image';

      const result = await saveImage(buffer, outputDir, prompt);

      expect(fs.mkdir).toHaveBeenCalledWith(outputDir, { recursive: true });
      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(outputDir, 'test_image.png'),
        buffer
      );
      expect(result).toBe(path.join(outputDir, 'test_image.png'));
    });

    it('should append index to filename for batch generations', async () => {
      const buffer = Buffer.from('test-image');
      const outputDir = './test-output';
      const prompt = 'Test Image';

      const result = await saveImage(buffer, outputDir, prompt, 2);

      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(outputDir, 'test_image_2.png'),
        buffer
      );
      expect(result).toBe(path.join(outputDir, 'test_image_2.png'));
    });

    it('should handle duplicate filenames with incrementing suffix', async () => {
      const buffer = Buffer.from('test-image');
      const outputDir = './test-output';
      const prompt = 'Test Image';

      // First call: file exists, second call: file_1 exists, third call: file_2 doesn't exist
      vi.mocked(existsSync)
        .mockReturnValueOnce(true)  // original file exists
        .mockReturnValueOnce(true)  // file_1 exists
        .mockReturnValueOnce(false); // file_2 doesn't exist

      const result = await saveImage(buffer, outputDir, prompt);

      expect(result).toBe(path.join(outputDir, 'test_image_2.png'));
    });
  });

  describe('saveVideo', () => {
    beforeEach(() => {
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.mocked(existsSync).mockReturnValue(false);
    });

    it('should save video with sanitized filename', async () => {
      const buffer = Buffer.from('test-video');
      const outputDir = './test-output';
      const prompt = 'Test Video';

      const result = await saveVideo(buffer, outputDir, prompt);

      expect(fs.mkdir).toHaveBeenCalledWith(outputDir, { recursive: true });
      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(outputDir, 'test_video.mp4'),
        buffer
      );
      expect(result).toBe(path.join(outputDir, 'test_video.mp4'));
    });

    it('should use default output dir if not provided', async () => {
      const buffer = Buffer.from('test-video');
      const prompt = 'Test Video';

      process.env.OUTPUT_DIR = 'default-output';
      const result = await saveVideo(buffer, undefined, prompt);

      expect(fs.mkdir).toHaveBeenCalledWith('default-output', { recursive: true });
      expect(result).toContain('default-output');
    });
  });

  describe('loadImage', () => {
    it('should load image from path', async () => {
      const mockBuffer = Buffer.from('test-image');
      vi.mocked(fs.readFile).mockResolvedValue(mockBuffer);

      const result = await loadImage('./test-image.png');

      expect(fs.readFile).toHaveBeenCalledWith('./test-image.png');
      expect(result).toBe(mockBuffer);
    });

    it('should throw error if file not found', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('ENOENT: no such file'));

      await expect(loadImage('./nonexistent.png')).rejects.toThrow(
        'Failed to load image from ./nonexistent.png: ENOENT: no such file'
      );
    });

    it('should handle non-Error exceptions', async () => {
      vi.mocked(fs.readFile).mockRejectedValue('string error');

      await expect(loadImage('./test.png')).rejects.toThrow(
        'Failed to load image from ./test.png'
      );
    });
  });
});
