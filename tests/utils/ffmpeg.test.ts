/**
 * FFmpeg Utility Tests
 *
 * Tests for FFmpeg video processing operations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as ffmpeg from '../../src/utils/ffmpeg.js';
import { exec } from 'child_process';
import { existsSync } from 'fs';
import * as fs from 'fs/promises';

// Mock child_process
vi.mock('child_process', () => ({
  exec: vi.fn(),
}));

// Mock fs
vi.mock('fs', () => ({
  existsSync: vi.fn(),
}));

// Mock fs/promises
vi.mock('fs/promises', () => ({
  writeFile: vi.fn(),
  unlink: vi.fn(),
  copyFile: vi.fn(),
}));

describe('FFmpeg Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: files exist
    vi.mocked(existsSync).mockReturnValue(true);
  });

  describe('checkFfmpegInstalled', () => {
    it('should return true when ffmpeg is installed', async () => {
      vi.mocked(exec).mockImplementation((cmd: any, callback: any) => {
        callback(null, { stdout: 'ffmpeg version 4.4.0', stderr: '' });
        return {} as any;
      });

      const result = await ffmpeg.checkFfmpegInstalled();
      expect(result).toBe(true);
      expect(exec).toHaveBeenCalledWith('ffmpeg -version', expect.any(Function));
    });

    it('should return false when ffmpeg is not installed', async () => {
      vi.mocked(exec).mockImplementation((cmd: any, callback: any) => {
        callback(new Error('Command not found'), { stdout: '', stderr: '' });
        return {} as any;
      });

      const result = await ffmpeg.checkFfmpegInstalled();
      expect(result).toBe(false);
    });
  });

  describe('getVideoDuration', () => {
    it('should return video duration in seconds', async () => {
      vi.mocked(exec).mockImplementation((cmd: any, callback: any) => {
        callback(null, { stdout: '10.5\n', stderr: '' });
        return {} as any;
      });

      const duration = await ffmpeg.getVideoDuration('/path/to/video.mp4');
      expect(duration).toBe(10.5);
      expect(exec).toHaveBeenCalledWith(
        expect.stringContaining('ffprobe'),
        expect.any(Function)
      );
    });

    it('should throw error when video file does not exist', async () => {
      vi.mocked(existsSync).mockReturnValue(false);

      await expect(ffmpeg.getVideoDuration('/nonexistent.mp4')).rejects.toThrow(
        'Video file not found'
      );
    });

    it('should throw error when ffprobe fails', async () => {
      vi.mocked(exec).mockImplementation((cmd: any, callback: any) => {
        callback(new Error('ffprobe error'), { stdout: '', stderr: '' });
        return {} as any;
      });

      await expect(ffmpeg.getVideoDuration('/path/to/video.mp4')).rejects.toThrow(
        'Failed to get video duration'
      );
    });

    it('should throw error when duration cannot be parsed', async () => {
      vi.mocked(exec).mockImplementation((cmd: any, callback: any) => {
        callback(null, { stdout: 'invalid\n', stderr: '' });
        return {} as any;
      });

      await expect(ffmpeg.getVideoDuration('/path/to/video.mp4')).rejects.toThrow(
        'Failed to parse video duration'
      );
    });
  });

  describe('trimVideo', () => {
    it('should trim video from startTime for duration', async () => {
      vi.mocked(exec).mockImplementation((cmd: any, callback: any) => {
        callback(null, { stdout: '', stderr: '' });
        return {} as any;
      });

      await ffmpeg.trimVideo('/input.mp4', 5, 10, '/output.mp4');

      expect(exec).toHaveBeenCalledWith(
        expect.stringContaining('-ss 5 -t 10'),
        expect.any(Function)
      );
    });

    it('should throw error when video file does not exist', async () => {
      vi.mocked(existsSync).mockReturnValue(false);

      await expect(ffmpeg.trimVideo('/nonexistent.mp4', 0, 5, '/output.mp4')).rejects.toThrow(
        'Video file not found'
      );
    });

    it('should throw error for invalid startTime', async () => {
      await expect(ffmpeg.trimVideo('/input.mp4', -1, 5, '/output.mp4')).rejects.toThrow(
        'Invalid trim parameters'
      );
    });

    it('should throw error for invalid duration', async () => {
      await expect(ffmpeg.trimVideo('/input.mp4', 0, -5, '/output.mp4')).rejects.toThrow(
        'Invalid trim parameters'
      );
    });

    it('should throw error when ffmpeg fails', async () => {
      vi.mocked(exec).mockImplementation((cmd: any, callback: any) => {
        callback(new Error('ffmpeg error'), { stdout: '', stderr: '' });
        return {} as any;
      });

      await expect(ffmpeg.trimVideo('/input.mp4', 0, 5, '/output.mp4')).rejects.toThrow(
        'Failed to trim video'
      );
    });
  });

  describe('addAudioTrack', () => {
    it('should add audio track to video', async () => {
      vi.mocked(exec).mockImplementation((cmd: any, callback: any) => {
        callback(null, { stdout: '', stderr: '' });
        return {} as any;
      });

      await ffmpeg.addAudioTrack('/video.mp4', '/audio.mp3', '/output.mp4');

      expect(exec).toHaveBeenCalledWith(
        expect.stringContaining('amix'),
        expect.any(Function)
      );
    });

    it('should apply custom volume to audio track', async () => {
      vi.mocked(exec).mockImplementation((cmd: any, callback: any) => {
        callback(null, { stdout: '', stderr: '' });
        return {} as any;
      });

      await ffmpeg.addAudioTrack('/video.mp4', '/audio.mp3', '/output.mp4', 0.5);

      expect(exec).toHaveBeenCalledWith(
        expect.stringContaining('volume=0.5'),
        expect.any(Function)
      );
    });

    it('should throw error when video file does not exist', async () => {
      vi.mocked(existsSync).mockReturnValueOnce(false);

      await expect(
        ffmpeg.addAudioTrack('/nonexistent.mp4', '/audio.mp3', '/output.mp4')
      ).rejects.toThrow('Video file not found');
    });

    it('should throw error when audio file does not exist', async () => {
      vi.mocked(existsSync).mockReturnValueOnce(true).mockReturnValueOnce(false);

      await expect(
        ffmpeg.addAudioTrack('/video.mp4', '/nonexistent.mp3', '/output.mp4')
      ).rejects.toThrow('Audio file not found');
    });

    it('should throw error for invalid volume', async () => {
      await expect(
        ffmpeg.addAudioTrack('/video.mp4', '/audio.mp3', '/output.mp4', 1.5)
      ).rejects.toThrow('Volume must be between 0 and 1');
    });

    it('should throw error when ffmpeg fails', async () => {
      vi.mocked(exec).mockImplementation((cmd: any, callback: any) => {
        callback(new Error('ffmpeg error'), { stdout: '', stderr: '' });
        return {} as any;
      });

      await expect(
        ffmpeg.addAudioTrack('/video.mp4', '/audio.mp3', '/output.mp4')
      ).rejects.toThrow('Failed to add audio track');
    });
  });

  describe('concatenateVideos', () => {
    beforeEach(() => {
      vi.mocked(exec).mockImplementation((cmd: any, callback: any) => {
        callback(null, { stdout: '', stderr: '' });
        return {} as any;
      });
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.mocked(fs.unlink).mockResolvedValue(undefined);
      vi.mocked(fs.copyFile).mockResolvedValue(undefined);
    });

    it('should concatenate videos with cut transition', async () => {
      await ffmpeg.concatenateVideos(
        ['/video1.mp4', '/video2.mp4'],
        '/output.mp4',
        { transition: 'cut' }
      );

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('.concat.txt'),
        expect.stringContaining("file '/video1.mp4'")
      );
      expect(exec).toHaveBeenCalledWith(
        expect.stringContaining('-f concat'),
        expect.any(Function)
      );
    });

    it('should concatenate videos with crossfade transition', async () => {
      await ffmpeg.concatenateVideos(
        ['/video1.mp4', '/video2.mp4'],
        '/output.mp4',
        { transition: 'crossfade', transitionDuration: 1.0 }
      );

      expect(exec).toHaveBeenCalledWith(
        expect.stringContaining('xfade'),
        expect.any(Function)
      );
    });

    it('should concatenate videos with fade transition', async () => {
      await ffmpeg.concatenateVideos(
        ['/video1.mp4', '/video2.mp4'],
        '/output.mp4',
        { transition: 'fade', transitionDuration: 0.5 }
      );

      expect(exec).toHaveBeenCalledWith(
        expect.stringContaining('fade'),
        expect.any(Function)
      );
    });

    it('should use default crossfade transition', async () => {
      await ffmpeg.concatenateVideos(['/video1.mp4', '/video2.mp4'], '/output.mp4');

      expect(exec).toHaveBeenCalledWith(
        expect.stringContaining('xfade'),
        expect.any(Function)
      );
    });

    it('should throw error for empty video list', async () => {
      await expect(ffmpeg.concatenateVideos([], '/output.mp4')).rejects.toThrow(
        'No videos provided'
      );
    });

    it('should throw error when a video file does not exist', async () => {
      vi.mocked(existsSync).mockReturnValueOnce(true).mockReturnValueOnce(false);

      await expect(
        ffmpeg.concatenateVideos(['/video1.mp4', '/nonexistent.mp4'], '/output.mp4')
      ).rejects.toThrow('Video file not found');
    });

    it('should throw error for unknown transition type', async () => {
      await expect(
        ffmpeg.concatenateVideos(['/video1.mp4', '/video2.mp4'], '/output.mp4', {
          transition: 'invalid' as any,
        })
      ).rejects.toThrow('Unknown transition type');
    });

    it('should handle single video with crossfade (copy file)', async () => {
      await ffmpeg.concatenateVideos(['/video1.mp4'], '/output.mp4', {
        transition: 'crossfade',
      });

      expect(fs.copyFile).toHaveBeenCalledWith('/video1.mp4', '/output.mp4');
    });

    it('should clean up concat file after cut concatenation', async () => {
      await ffmpeg.concatenateVideos(['/video1.mp4', '/video2.mp4'], '/output.mp4', {
        transition: 'cut',
      });

      expect(fs.unlink).toHaveBeenCalledWith(expect.stringContaining('.concat.txt'));
    });

    it('should throw error when ffmpeg fails', async () => {
      vi.mocked(exec).mockImplementation((cmd: any, callback: any) => {
        callback(new Error('ffmpeg error'), { stdout: '', stderr: '' });
        return {} as any;
      });

      await expect(
        ffmpeg.concatenateVideos(['/video1.mp4', '/video2.mp4'], '/output.mp4')
      ).rejects.toThrow('Failed to concatenate videos');
    });
  });
});
