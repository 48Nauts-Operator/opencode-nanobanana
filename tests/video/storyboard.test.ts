/**
 * Storyboard Video Integration Tests
 *
 * Integration tests for multi-scene storyboard video generation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateStoryboardVideo } from '../../src/tools/video/storyboard-video.js';
import * as ffmpeg from '../../src/utils/ffmpeg.js';
import { GeminiProvider } from '../../src/providers/gemini.js';
import * as fs from 'fs/promises';
import { existsSync } from 'fs';

// Mock dependencies
vi.mock('../../src/utils/ffmpeg.js', () => ({
  checkFfmpegInstalled: vi.fn(),
  concatenateVideos: vi.fn(),
  addAudioTrack: vi.fn(),
}));

vi.mock('fs', () => ({
  existsSync: vi.fn(),
}));

vi.mock('fs/promises', () => ({
  writeFile: vi.fn(),
  unlink: vi.fn(),
  readFile: vi.fn(),
}));

vi.mock('../../src/providers/gemini.js', () => {
  const mockProvider = {
    generateVideo: vi.fn(),
    generateVideoWithReferences: vi.fn(),
  };

  return {
    GeminiProvider: vi.fn(() => mockProvider),
  };
});

describe('Storyboard Video Integration Tests', () => {
  let mockProvider: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks - cast to vi.Mock to access mock methods
    (ffmpeg.checkFfmpegInstalled as any).mockResolvedValue(true);
    (ffmpeg.concatenateVideos as any).mockResolvedValue();
    (ffmpeg.addAudioTrack as any).mockResolvedValue();
    (existsSync as any).mockReturnValue(true);
    (fs.writeFile as any).mockResolvedValue();
    (fs.unlink as any).mockResolvedValue();
    (fs.readFile as any).mockResolvedValue(Buffer.from('fake-image-data'));

    // Get mocked provider instance
    mockProvider = new GeminiProvider('test-api-key');

    // Setup default video generation responses
    mockProvider.generateVideo.mockResolvedValue({
      buffer: Buffer.from('fake-video-data'),
    });

    mockProvider.generateVideoWithReferences.mockResolvedValue({
      buffer: Buffer.from('fake-video-data'),
    });
  });

  describe('Multi-scene generation with mocked Veo API', () => {
    it('should generate multiple scenes in parallel', async () => {
      const options = {
        apiKey: 'test-api-key',
        scenes: [
          'A serene mountain landscape',
          'A hiker on a trail',
          'A campfire at dusk',
        ],
      };

      const result = await generateStoryboardVideo(options);

      // Verify all scenes were generated
      expect(mockProvider.generateVideo).toHaveBeenCalledTimes(3);

      // Verify scenes were written to temp files
      expect(fs.writeFile).toHaveBeenCalledTimes(3);

      // Verify result structure
      expect(result).toMatchObject({
        videoPath: expect.any(String),
        totalTime: expect.any(Number),
        sceneTimes: expect.arrayContaining([
          { scene: 1, time: expect.any(Number) },
          { scene: 2, time: expect.any(Number) },
          { scene: 3, time: expect.any(Number) },
        ]),
        successCount: 3,
        failureCount: 0,
      });
    });

    it('should apply style prefix to all scenes', async () => {
      const options = {
        apiKey: 'test-api-key',
        scenes: ['Mountain landscape', 'Hiker on trail'],
        style: 'cinematic',
      };

      await generateStoryboardVideo(options);

      // Verify style prefix was added to prompts
      expect(mockProvider.generateVideo).toHaveBeenCalledWith(
        'cinematic style: Mountain landscape',
        expect.any(Object)
      );
      expect(mockProvider.generateVideo).toHaveBeenCalledWith(
        'cinematic style: Hiker on trail',
        expect.any(Object)
      );
    });

    it('should pass correct options to video generation', async () => {
      const options = {
        apiKey: 'test-api-key',
        scenes: ['Test scene'],
        aspectRatio: '9:16' as const,
        generateAudio: false,
      };

      await generateStoryboardVideo(options);

      expect(mockProvider.generateVideo).toHaveBeenCalledWith(
        'Test scene',
        expect.objectContaining({
          aspectRatio: '9:16',
          resolution: '720p',
          duration: 8,
          generateAudio: false,
          numberOfVideos: 1,
        })
      );
    });
  });

  describe('FFmpeg stitching with mocked commands', () => {
    it('should call concatenateVideos with correct parameters', async () => {
      const options = {
        apiKey: 'test-api-key',
        scenes: ['Scene 1', 'Scene 2'],
        transition: 'crossfade' as const,
        transitionDuration: 1.0,
        outputPath: '/output/test-video.mp4',
      };

      await generateStoryboardVideo(options);

      expect(ffmpeg.concatenateVideos).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.stringContaining('scene-0-'),
          expect.stringContaining('scene-1-'),
        ]),
        '/output/test-video.mp4',
        {
          transition: 'crossfade',
          transitionDuration: 1.0,
        }
      );
    });

    it('should clean up temporary scene files after stitching', async () => {
      const options = {
        apiKey: 'test-api-key',
        scenes: ['Scene 1', 'Scene 2'],
      };

      await generateStoryboardVideo(options);

      // Verify unlink was called for each scene file
      expect(fs.unlink).toHaveBeenCalledTimes(2);
    });

    it('should handle background music mixing', async () => {
      const options = {
        apiKey: 'test-api-key',
        scenes: ['Scene 1'],
        backgroundMusic: '/path/to/music.mp3',
        musicVolume: 0.5,
        outputPath: '/output/final.mp4',
      };

      await generateStoryboardVideo(options);

      // Verify stitching happened to temp file first
      expect(ffmpeg.concatenateVideos).toHaveBeenCalledWith(
        expect.any(Array),
        expect.stringContaining('stitched-'),
        expect.any(Object)
      );

      // Verify audio was added to final output
      expect(ffmpeg.addAudioTrack).toHaveBeenCalledWith(
        expect.stringContaining('stitched-'),
        '/path/to/music.mp3',
        '/output/final.mp4',
        0.5
      );
    });
  });

  describe('Transition options (cut, crossfade, fade)', () => {
    it('should use cut transition when specified', async () => {
      const options = {
        apiKey: 'test-api-key',
        scenes: ['Scene 1', 'Scene 2'],
        transition: 'cut' as const,
      };

      await generateStoryboardVideo(options);

      expect(ffmpeg.concatenateVideos).toHaveBeenCalledWith(
        expect.any(Array),
        expect.any(String),
        expect.objectContaining({
          transition: 'cut',
        })
      );
    });

    it('should use crossfade transition by default', async () => {
      const options = {
        apiKey: 'test-api-key',
        scenes: ['Scene 1', 'Scene 2'],
      };

      await generateStoryboardVideo(options);

      expect(ffmpeg.concatenateVideos).toHaveBeenCalledWith(
        expect.any(Array),
        expect.any(String),
        expect.objectContaining({
          transition: 'crossfade',
        })
      );
    });

    it('should use fade transition when specified', async () => {
      const options = {
        apiKey: 'test-api-key',
        scenes: ['Scene 1', 'Scene 2'],
        transition: 'fade' as const,
        transitionDuration: 0.75,
      };

      await generateStoryboardVideo(options);

      expect(ffmpeg.concatenateVideos).toHaveBeenCalledWith(
        expect.any(Array),
        expect.any(String),
        expect.objectContaining({
          transition: 'fade',
          transitionDuration: 0.75,
        })
      );
    });
  });

  describe('Character consistency with style prefix', () => {
    it('should prepend character description to each scene', async () => {
      const options = {
        apiKey: 'test-api-key',
        scenes: ['Walking in forest', 'Discovering waterfall'],
        characterDescription: 'A young woman with red jacket',
      };

      await generateStoryboardVideo(options);

      expect(mockProvider.generateVideo).toHaveBeenCalledWith(
        'A young woman with red jacket. Walking in forest',
        expect.any(Object)
      );
      expect(mockProvider.generateVideo).toHaveBeenCalledWith(
        'A young woman with red jacket. Discovering waterfall',
        expect.any(Object)
      );
    });

    it('should use reference images for character consistency', async () => {
      const options = {
        apiKey: 'test-api-key',
        scenes: ['Scene 1', 'Scene 2'],
        referenceImages: ['/path/to/ref1.jpg', '/path/to/ref2.jpg'],
      };

      await generateStoryboardVideo(options);

      // Verify reference images were loaded
      expect(fs.readFile).toHaveBeenCalledWith('/path/to/ref1.jpg');
      expect(fs.readFile).toHaveBeenCalledWith('/path/to/ref2.jpg');

      // Verify generateVideoWithReferences was used
      expect(mockProvider.generateVideoWithReferences).toHaveBeenCalledTimes(2);
      expect(mockProvider.generateVideoWithReferences).toHaveBeenCalledWith(
        'Scene 1',
        expect.arrayContaining([
          expect.objectContaining({
            buffer: expect.any(Buffer),
            description: expect.stringContaining('Reference image'),
          }),
        ]),
        expect.any(Object)
      );
    });

    it('should combine character description, style, and scene', async () => {
      const options = {
        apiKey: 'test-api-key',
        scenes: ['Walking through city'],
        characterDescription: 'Detective in trench coat',
        style: 'noir',
      };

      await generateStoryboardVideo(options);

      expect(mockProvider.generateVideo).toHaveBeenCalledWith(
        'noir style: Detective in trench coat. Walking through city',
        expect.any(Object)
      );
    });

    it('should reject more than 3 reference images', async () => {
      const options = {
        apiKey: 'test-api-key',
        scenes: ['Scene 1'],
        referenceImages: [
          '/ref1.jpg',
          '/ref2.jpg',
          '/ref3.jpg',
          '/ref4.jpg',
        ],
      };

      await expect(generateStoryboardVideo(options)).rejects.toThrow(
        'Maximum of 3 reference images allowed'
      );
    });
  });

  describe('Error handling for failed scenes', () => {
    it('should continue with successful scenes when some fail', async () => {
      // Mock one scene to fail
      mockProvider.generateVideo
        .mockResolvedValueOnce({ buffer: Buffer.from('video1') })
        .mockRejectedValueOnce(new Error('Generation failed'))
        .mockResolvedValueOnce({ buffer: Buffer.from('video3') });

      const options = {
        apiKey: 'test-api-key',
        scenes: ['Scene 1', 'Scene 2', 'Scene 3'],
      };

      const result = await generateStoryboardVideo(options);

      // Should have 2 successful and 1 failed
      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(1);

      // Should still concatenate the successful scenes
      expect(ffmpeg.concatenateVideos).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.stringContaining('scene-0-'),
          expect.stringContaining('scene-2-'),
        ]),
        expect.any(String),
        expect.any(Object)
      );
    });

    it('should throw error when all scenes fail', async () => {
      mockProvider.generateVideo.mockRejectedValue(
        new Error('Generation failed')
      );

      const options = {
        apiKey: 'test-api-key',
        scenes: ['Scene 1', 'Scene 2'],
      };

      await expect(generateStoryboardVideo(options)).rejects.toThrow(
        'All scenes failed to generate'
      );
    });

    it('should throw error when no scenes provided', async () => {
      const options = {
        apiKey: 'test-api-key',
        scenes: [],
      };

      await expect(generateStoryboardVideo(options)).rejects.toThrow(
        'At least one scene is required'
      );
    });

    it('should throw error when FFmpeg is not installed', async () => {
      (ffmpeg.checkFfmpegInstalled as any).mockResolvedValue(false);

      const options = {
        apiKey: 'test-api-key',
        scenes: ['Scene 1'],
      };

      await expect(generateStoryboardVideo(options)).rejects.toThrow(
        'FFmpeg is not installed'
      );
    });

    it('should clean up temporary files even when stitching fails', async () => {
      (ffmpeg.concatenateVideos as any).mockRejectedValue(
        new Error('Stitching failed')
      );

      const options = {
        apiKey: 'test-api-key',
        scenes: ['Scene 1', 'Scene 2'],
      };

      await expect(generateStoryboardVideo(options)).rejects.toThrow(
        'Stitching failed'
      );

      // Verify cleanup still happened
      expect(fs.unlink).toHaveBeenCalledTimes(2);
    });
  });

  describe('Progress reporting and timing', () => {
    it('should track timing for each scene', async () => {
      const options = {
        apiKey: 'test-api-key',
        scenes: ['Scene 1', 'Scene 2'],
      };

      const result = await generateStoryboardVideo(options);

      expect(result.sceneTimes).toHaveLength(2);
      expect(result.sceneTimes[0]).toMatchObject({
        scene: 1,
        time: expect.any(Number),
      });
      expect(result.sceneTimes[1]).toMatchObject({
        scene: 2,
        time: expect.any(Number),
      });
    });

    it('should track total generation time', async () => {
      const options = {
        apiKey: 'test-api-key',
        scenes: ['Scene 1'],
      };

      const result = await generateStoryboardVideo(options);

      expect(result.totalTime).toBeGreaterThanOrEqual(0);
      expect(result.totalTime).toBeTypeOf('number');
    });
  });
});
