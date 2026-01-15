/**
 * Storyboard Video Generation Tool
 *
 * Generates a multi-scene video by creating individual scenes in parallel
 * and stitching them together with transitions using FFmpeg.
 */

import { GeminiProvider } from '../../providers/gemini.js';
import {
  checkFfmpegInstalled,
  concatenateVideos,
  type ConcatenateOptions,
} from '../../utils/ffmpeg.js';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

export interface StoryboardVideoOptions {
  /** Array of scene descriptions */
  scenes: string[];
  /** Style to apply to all scenes (e.g., 'cinematic', 'commercial') */
  style?: string;
  /** Aspect ratio for all scenes (default: '16:9') */
  aspectRatio?: '16:9' | '9:16' | '1:1';
  /** Transition type between scenes (default: 'crossfade') */
  transition?: 'cut' | 'crossfade' | 'fade';
  /** Transition duration in seconds (default: 0.5) */
  transitionDuration?: number;
  /** Output path for the final video */
  outputPath?: string;
  /** Gemini API key */
  apiKey: string;
}

export interface StoryboardVideoResult {
  /** Path to the final stitched video */
  videoPath: string;
  /** Total generation time in milliseconds */
  totalTime: number;
  /** Per-scene generation times */
  sceneTimes: Array<{ scene: number; time: number }>;
  /** Number of scenes successfully generated */
  successCount: number;
  /** Number of scenes that failed */
  failureCount: number;
}

/**
 * Generate a multi-scene storyboard video
 *
 * This function generates multiple video scenes in parallel and stitches them
 * together with transitions to create a cohesive video narrative.
 *
 * @param options - Configuration options for the storyboard video
 * @returns Result object with video path and timing information
 *
 * @example
 * ```typescript
 * const result = await generateStoryboardVideo({
 *   apiKey: 'your-api-key',
 *   scenes: [
 *     'A serene mountain landscape at sunrise',
 *     'A hiker reaching the summit',
 *     'Panoramic view from the peak'
 *   ],
 *   style: 'cinematic',
 *   transition: 'crossfade',
 *   outputPath: './mountain-journey.mp4'
 * });
 * ```
 */
export async function generateStoryboardVideo(
  options: StoryboardVideoOptions
): Promise<StoryboardVideoResult> {
  const startTime = Date.now();

  // Validate inputs
  if (!options.scenes || options.scenes.length === 0) {
    throw new Error('At least one scene is required');
  }

  // Check FFmpeg availability
  const ffmpegAvailable = await checkFfmpegInstalled();
  if (!ffmpegAvailable) {
    throw new Error(
      'FFmpeg is not installed or not available in PATH. Please install FFmpeg to use this tool.'
    );
  }

  // Initialize provider
  const provider = new GeminiProvider(options.apiKey);

  // Set default values
  const {
    scenes,
    style,
    aspectRatio = '16:9',
    transition = 'crossfade',
    transitionDuration = 0.5,
    outputPath = join(tmpdir(), `storyboard-${Date.now()}.mp4`),
  } = options;

  console.log(`🎬 Generating storyboard with ${scenes.length} scenes...`);

  // Generate all scenes in parallel
  const scenePromises = scenes.map(async (sceneDescription, index) => {
    const sceneStartTime = Date.now();
    console.log(`📹 Generating scene ${index + 1}/${scenes.length}...`);

    try {
      // Add style prefix if provided
      const prompt = style
        ? `${style} style: ${sceneDescription}`
        : sceneDescription;

      // Generate video for this scene
      const result = await provider.generateVideo(prompt, {
        aspectRatio,
        resolution: '720p',
        duration: 8,
        generateAudio: true,
        numberOfVideos: 1,
      });

      // Save to temporary file
      const tempPath = join(tmpdir(), `scene-${index}-${Date.now()}.mp4`);
      await writeFile(tempPath, result.buffer);

      const sceneTime = Date.now() - sceneStartTime;
      console.log(`✅ Scene ${index + 1} completed in ${(sceneTime / 1000).toFixed(1)}s`);

      return {
        index,
        path: tempPath,
        time: sceneTime,
        success: true,
      };
    } catch (error) {
      const sceneTime = Date.now() - sceneStartTime;
      console.error(`❌ Scene ${index + 1} failed:`, error);

      return {
        index,
        path: null,
        time: sceneTime,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  // Wait for all scenes to complete
  const sceneResults = await Promise.all(scenePromises);

  // Filter successful scenes
  const successfulScenes = sceneResults.filter(
    (result): result is { index: number; path: string; time: number; success: true } =>
      result.success && result.path !== null
  );

  if (successfulScenes.length === 0) {
    throw new Error('All scenes failed to generate. No video to stitch.');
  }

  if (successfulScenes.length < sceneResults.length) {
    console.warn(
      `⚠️  ${sceneResults.length - successfulScenes.length} scene(s) failed. Continuing with ${successfulScenes.length} successful scene(s).`
    );
  }

  // Sort by original index to maintain scene order
  successfulScenes.sort((a, b) => a.index - b.index);
  const videoPaths = successfulScenes.map((s) => s.path);

  // Stitch videos together
  console.log(`🎞️  Stitching ${videoPaths.length} scenes with ${transition} transition...`);

  const concatenateOptions: ConcatenateOptions = {
    transition,
    transitionDuration,
  };

  try {
    await concatenateVideos(videoPaths, outputPath, concatenateOptions);
  } finally {
    // Clean up temporary scene files
    for (const videoPath of videoPaths) {
      try {
        await unlink(videoPath);
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  const totalTime = Date.now() - startTime;
  console.log(`✨ Storyboard complete! Total time: ${(totalTime / 1000).toFixed(1)}s`);
  console.log(`📁 Video saved to: ${outputPath}`);

  return {
    videoPath: outputPath,
    totalTime,
    sceneTimes: sceneResults.map((r) => ({
      scene: r.index + 1,
      time: r.time,
    })),
    successCount: successfulScenes.length,
    failureCount: sceneResults.length - successfulScenes.length,
  };
}
