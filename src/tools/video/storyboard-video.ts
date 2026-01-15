/**
 * Storyboard Video Generation Tool
 *
 * Generates a multi-scene video by creating individual scenes in parallel
 * and stitching them together with transitions using FFmpeg.
 */

import { GeminiProvider, type ReferenceImage } from '../../providers/gemini.js';
import {
  checkFfmpegInstalled,
  concatenateVideos,
  addAudioTrack,
  type ConcatenateOptions,
} from '../../utils/ffmpeg.js';
import { writeFile, unlink, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

export interface StoryboardVideoOptions {
  /** Array of scene descriptions */
  scenes: string[];
  /** Style to apply to all scenes (e.g., 'cinematic', 'commercial') */
  style?: string;
  /** Character description to prepend to each scene for consistency */
  characterDescription?: string;
  /** Array of reference image paths for character/scene consistency (max 3) */
  referenceImages?: string[];
  /** Aspect ratio for all scenes (default: '16:9') */
  aspectRatio?: '16:9' | '9:16' | '1:1';
  /** Transition type between scenes (default: 'crossfade') */
  transition?: 'cut' | 'crossfade' | 'fade';
  /** Transition duration in seconds (default: 0.5) */
  transitionDuration?: number;
  /** Enable native Veo audio generation (default: true) */
  generateAudio?: boolean;
  /** Path to background music audio file (optional) */
  backgroundMusic?: string;
  /** Volume level for background music (0.0-1.0, default: 0.3) */
  musicVolume?: number;
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
 * Basic usage:
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
 *
 * @example
 * With character consistency:
 * ```typescript
 * const result = await generateStoryboardVideo({
 *   apiKey: 'your-api-key',
 *   characterDescription: 'A young woman with long brown hair wearing a red jacket',
 *   referenceImages: ['./character-ref.jpg'],
 *   scenes: [
 *     'Walking through a forest',
 *     'Discovering a hidden waterfall',
 *     'Setting up camp at sunset'
 *   ],
 *   style: 'cinematic',
 *   transition: 'crossfade'
 * });
 * ```
 *
 * @example
 * With background music:
 * ```typescript
 * const result = await generateStoryboardVideo({
 *   apiKey: 'your-api-key',
 *   scenes: ['Scene 1', 'Scene 2', 'Scene 3'],
 *   generateAudio: true,           // Native Veo audio (default)
 *   backgroundMusic: './music.mp3', // Add background music
 *   musicVolume: 0.3,               // 30% volume for background music
 *   transition: 'crossfade'
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
    characterDescription,
    referenceImages,
    aspectRatio = '16:9',
    transition = 'crossfade',
    transitionDuration = 0.5,
    generateAudio = true,
    backgroundMusic,
    musicVolume = 0.3,
    outputPath = join(tmpdir(), `storyboard-${Date.now()}.mp4`),
  } = options;

  // Load reference images if provided
  let loadedReferences: ReferenceImage[] | undefined;
  if (referenceImages && referenceImages.length > 0) {
    if (referenceImages.length > 3) {
      throw new Error('Maximum of 3 reference images allowed');
    }

    console.log(`📸 Loading ${referenceImages.length} reference image(s)...`);
    loadedReferences = await Promise.all(
      referenceImages.map(async (imagePath, index) => {
        const buffer = await readFile(imagePath);
        return {
          buffer,
          description: `Reference image ${index + 1} for character/scene consistency`,
        };
      })
    );
  }

  console.log(`\n🎬 Starting storyboard generation with ${scenes.length} scene(s)`);
  console.log(`⚙️  Configuration:`);
  console.log(`   - Aspect ratio: ${aspectRatio}`);
  console.log(`   - Transition: ${transition} (${transitionDuration}s)`);
  console.log(`   - Audio: ${generateAudio ? 'enabled' : 'disabled'}${backgroundMusic ? ' + background music' : ''}`);

  if (characterDescription) {
    console.log(`👤 Using character description: "${characterDescription}"`);
  }
  if (loadedReferences) {
    console.log(`🖼️  Using ${loadedReferences.length} reference image(s) for consistency`);
  }

  console.log(`\n📹 Generating scenes...`);

  // Generate all scenes in parallel
  const scenePromises = scenes.map(async (sceneDescription, index) => {
    const sceneStartTime = Date.now();
    console.log(`   [${index + 1}/${scenes.length}] Starting: "${sceneDescription.slice(0, 50)}${sceneDescription.length > 50 ? '...' : ''}"`);

    try {
      // Build prompt with character description, style, and scene
      let prompt = sceneDescription;

      // Prepend character description if provided
      if (characterDescription) {
        prompt = `${characterDescription}. ${prompt}`;
      }

      // Add style prefix if provided
      if (style) {
        prompt = `${style} style: ${prompt}`;
      }

      // Generate video for this scene
      let result;
      if (loadedReferences && loadedReferences.length > 0) {
        // Use reference images for consistency
        result = await provider.generateVideoWithReferences(
          prompt,
          loadedReferences,
          {
            aspectRatio,
            resolution: '720p',
            duration: 8,
            generateAudio,
            numberOfVideos: 1,
          }
        );
      } else {
        // Generate without references
        result = await provider.generateVideo(prompt, {
          aspectRatio,
          resolution: '720p',
          duration: 8,
          generateAudio,
          numberOfVideos: 1,
        });
      }

      // Save to temporary file
      const tempPath = join(tmpdir(), `scene-${index}-${Date.now()}.mp4`);
      await writeFile(tempPath, result.buffer);

      const sceneTime = Date.now() - sceneStartTime;
      console.log(`   ✅ [${index + 1}/${scenes.length}] Completed in ${(sceneTime / 1000).toFixed(1)}s`);

      return {
        index,
        path: tempPath,
        time: sceneTime,
        success: true,
      };
    } catch (error) {
      const sceneTime = Date.now() - sceneStartTime;
      console.error(`   ❌ [${index + 1}/${scenes.length}] Failed after ${(sceneTime / 1000).toFixed(1)}s:`, error);

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
  console.log(`\n🎞️  Stitching ${videoPaths.length} scene(s) together...`);
  console.log(`   - Transition: ${transition}`);
  console.log(`   - Duration: ${transitionDuration}s`);

  const concatenateOptions: ConcatenateOptions = {
    transition,
    transitionDuration,
  };

  // Determine final output path based on whether we need to add background music
  const stitchedVideoPath = backgroundMusic
    ? join(tmpdir(), `stitched-${Date.now()}.mp4`)
    : outputPath;

  try {
    await concatenateVideos(videoPaths, stitchedVideoPath, concatenateOptions);

    // Add background music if provided
    if (backgroundMusic) {
      console.log(`\n🎵 Adding background music...`);
      console.log(`   - Volume: ${(musicVolume * 100).toFixed(0)}%`);
      await addAudioTrack(stitchedVideoPath, backgroundMusic, outputPath, musicVolume);
      console.log(`   ✅ Audio mixing complete`);
      // Clean up temporary stitched video
      await unlink(stitchedVideoPath).catch(() => {});
    }
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

  // Calculate average scene generation time
  const avgSceneTime = successfulScenes.length > 0
    ? successfulScenes.reduce((sum, s) => sum + s.time, 0) / successfulScenes.length
    : 0;

  console.log(`\n✨ Storyboard generation complete!`);
  console.log(`📊 Summary:`);
  console.log(`   - Total time: ${(totalTime / 1000).toFixed(1)}s`);
  console.log(`   - Scenes generated: ${successfulScenes.length}/${sceneResults.length}`);
  console.log(`   - Average scene time: ${(avgSceneTime / 1000).toFixed(1)}s`);
  console.log(`   - Success rate: ${((successfulScenes.length / sceneResults.length) * 100).toFixed(0)}%`);
  console.log(`📁 Output: ${outputPath}\n`);

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
