/**
 * GeminiProvider Tests
 *
 * Tests for Veo 3.1 video generation functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiProvider } from '../../src/providers/gemini.js';

// Mock the @google/genai module
vi.mock('@google/genai', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as any),
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateVideos: vi.fn(),
      },
      operations: {
        getVideosOperation: vi.fn(),
      },
    })),
  };
});

// Mock fetch
global.fetch = vi.fn();

describe('GeminiProvider', () => {
  let provider: GeminiProvider;
  let mockAi: any;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new GeminiProvider('test-api-key');
    mockAi = (provider as any).ai;
  });

  describe('generateVideo', () => {
    it('should generate video with default options', async () => {
      const mockCompletedOperation = {
        name: 'operations/test-123',
        done: true,
        response: {
          generatedVideos: [
            {
              video: {
                uri: 'https://example.com/video.mp4',
              },
            },
          ],
        },
      };

      const mockVideoBuffer = Buffer.from('mock-video-data');

      // Return completed operation immediately (no polling needed)
      mockAi.models.generateVideos.mockResolvedValueOnce(mockCompletedOperation);

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => mockVideoBuffer.buffer,
      });

      const result = await provider.generateVideo('test prompt');

      expect(mockAi.models.generateVideos).toHaveBeenCalledWith({
        model: 'veo-3.1-generate-001',
        prompt: 'test prompt',
        config: {
          numberOfVideos: 1,
          aspectRatio: '16:9',
          resolution: '720p',
          durationSeconds: 8,
          generateAudio: true,
        },
      });

      expect(result.buffer).toBeDefined();
      expect(result.generationTime).toBeGreaterThanOrEqual(0);
    });

    it('should generate video with custom options', async () => {
      const mockOperation = {
        name: 'operations/test-456',
        done: true,
        response: {
          generatedVideos: [
            {
              video: {
                uri: 'https://example.com/video2.mp4',
              },
            },
          ],
        },
      };

      mockAi.models.generateVideos.mockResolvedValueOnce(mockOperation);

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => Buffer.from('mock-video-data').buffer,
      });

      await provider.generateVideo('test prompt', {
        aspectRatio: '9:16',
        resolution: '1080p',
        duration: 6,
        generateAudio: false,
      });

      expect(mockAi.models.generateVideos).toHaveBeenCalledWith({
        model: 'veo-3.1-generate-001',
        prompt: 'test prompt',
        config: {
          numberOfVideos: 1,
          aspectRatio: '9:16',
          resolution: '1080p',
          durationSeconds: 6,
          generateAudio: false,
        },
      });
    });

    it('should poll until operation is done', async () => {
      vi.useFakeTimers();

      const mockPendingOperation = {
        name: 'operations/test-789',
        done: false,
      };

      const mockCompletedOperation = {
        name: 'operations/test-789',
        done: true,
        response: {
          generatedVideos: [
            {
              video: {
                uri: 'https://example.com/video3.mp4',
              },
            },
          ],
        },
      };

      mockAi.models.generateVideos.mockResolvedValueOnce(mockPendingOperation);
      mockAi.operations.getVideosOperation
        .mockResolvedValueOnce(mockPendingOperation)
        .mockResolvedValueOnce(mockCompletedOperation);

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => Buffer.from('mock-video-data').buffer,
      });

      const promise = provider.generateVideo('test prompt');

      // Fast-forward through the polling intervals
      await vi.advanceTimersByTimeAsync(20000);

      await promise;

      expect(mockAi.operations.getVideosOperation).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });

    it('should throw error if no video is generated', async () => {
      const mockOperation = {
        name: 'operations/test-error',
        done: true,
        response: {
          generatedVideos: [],
        },
      };

      mockAi.models.generateVideos.mockResolvedValueOnce(mockOperation);

      await expect(provider.generateVideo('test prompt')).rejects.toThrow(
        'No video was generated'
      );
    });
  });

  describe('animateImage', () => {
    it('should animate image with default options', async () => {
      const mockImageBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ]); // PNG header

      const mockOperation = {
        name: 'operations/animate-123',
        done: true,
        response: {
          generatedVideos: [
            {
              video: {
                uri: 'https://example.com/animated.mp4',
              },
            },
          ],
        },
      };

      mockAi.models.generateVideos.mockResolvedValueOnce(mockOperation);

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => Buffer.from('mock-video-data').buffer,
      });

      const result = await provider.animateImage(
        mockImageBuffer,
        'animate this image'
      );

      expect(mockAi.models.generateVideos).toHaveBeenCalledWith({
        model: 'veo-3.1-generate-001',
        prompt: 'animate this image',
        image: {
          imageBytes: mockImageBuffer.toString('base64'),
          mimeType: 'image/png',
        },
        config: {
          numberOfVideos: 1,
          aspectRatio: '16:9',
          resolution: '720p',
          durationSeconds: 8,
          generateAudio: true,
        },
      });

      expect(result.buffer).toBeDefined();
    });

    it('should detect JPEG mime type', async () => {
      const mockImageBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]); // JPEG header

      const mockOperation = {
        name: 'operations/animate-jpeg',
        done: true,
        response: {
          generatedVideos: [
            {
              video: {
                uri: 'https://example.com/animated-jpeg.mp4',
              },
            },
          ],
        },
      };

      mockAi.models.generateVideos.mockResolvedValueOnce(mockOperation);

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => Buffer.from('mock-video-data').buffer,
      });

      await provider.animateImage(mockImageBuffer, 'animate jpeg');

      const calls = mockAi.models.generateVideos.mock.calls;
      expect(calls[0]?.[0]?.image?.mimeType).toBe('image/jpeg');
    });
  });

  describe('extendVideo', () => {
    it('should extend video with new content', async () => {
      const mockVideoBuffer = Buffer.from('mock-video-data');

      const mockOperation = {
        name: 'operations/extend-123',
        done: true,
        response: {
          generatedVideos: [
            {
              video: {
                uri: 'https://example.com/extended.mp4',
              },
            },
          ],
        },
      };

      mockAi.models.generateVideos.mockResolvedValueOnce(mockOperation);

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => Buffer.from('extended-video-data').buffer,
      });

      const result = await provider.extendVideo(
        mockVideoBuffer,
        'extend with new scene'
      );

      expect(mockAi.models.generateVideos).toHaveBeenCalledWith({
        model: 'veo-3.1-generate-001',
        prompt: 'extend with new scene',
        video: {
          videoBytes: mockVideoBuffer.toString('base64'),
          mimeType: 'video/mp4',
        },
        config: {
          numberOfVideos: 1,
          aspectRatio: '16:9',
          resolution: '720p',
        },
      });

      expect(result.buffer).toBeDefined();
    });
  });

  describe('generateVideoWithReferences', () => {
    it('should generate video with reference images', async () => {
      const referenceImages = [
        {
          buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]), // PNG header
          description: 'Character reference',
        },
        {
          buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0]), // JPEG header
          description: 'Scene reference',
        },
      ];

      const mockOperation = {
        name: 'operations/ref-123',
        done: true,
        response: {
          generatedVideos: [
            {
              video: {
                uri: 'https://example.com/with-refs.mp4',
              },
            },
          ],
        },
      };

      mockAi.models.generateVideos.mockResolvedValueOnce(mockOperation);

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => Buffer.from('mock-video-data').buffer,
      });

      const result = await provider.generateVideoWithReferences(
        'video with character consistency',
        referenceImages
      );

      const calls = mockAi.models.generateVideos.mock.calls;
      const call = calls[0]?.[0];

      expect(call?.model).toBe('veo-3.1-generate-001');
      expect(call?.prompt).toBe('video with character consistency');
      expect(call?.config?.referenceImages).toHaveLength(2);
      expect(call?.config?.referenceImages?.[0]?.image?.imageBytes).toBe(
        referenceImages[0].buffer.toString('base64')
      );
      expect(call?.config?.referenceImages?.[0]?.image?.mimeType).toBe('image/png');
      expect(call?.config?.durationSeconds).toBe(8);
      expect(call?.config?.generateAudio).toBe(true);

      expect(result.buffer).toBeDefined();
    });

    it('should throw error if reference images count is invalid', async () => {
      await expect(
        provider.generateVideoWithReferences('test', [])
      ).rejects.toThrow('Reference images must be between 1 and 3');

      const tooManyRefs = Array(4)
        .fill(null)
        .map(() => ({
          buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
          description: 'test',
        }));

      await expect(
        provider.generateVideoWithReferences('test', tooManyRefs)
      ).rejects.toThrow('Reference images must be between 1 and 3');
    });
  });
});
