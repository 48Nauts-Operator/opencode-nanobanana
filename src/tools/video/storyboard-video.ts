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
  scenes: string[];
  style?: string;
  characterDescription?: string;
  referenceImages?: string[];
  aspectRatio?: '16:9' | '9:16';
  transition?: 'cut' | 'crossfade' | 'fade';
  transitionDuration?: number;
  backgroundMusic?: string;
  musicVolume?: number;
  outputPath?: string;
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

  const {
    scenes,
    style,
    characterDescription,
    referenceImages,
    aspectRatio = '16:9',
    transition = 'crossfade',
    transitionDuration = 0.5,
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
  console.log(`   - Audio: native (Veo 3.0)${backgroundMusic ? ' + background music' : ''}`);

  if (characterDescription) {
    console.log(`👤 Using character description: "${characterDescription}"`);
  }
  if (loadedReferences) {
    console.log(`🖼️  Using ${loadedReferences.length} reference image(s) for consistency`);
  }

  console.log(`\n📹 Generating scenes sequentially (to avoid rate limits)...`);

  type SceneResult = {
    index: number;
    path: string | null;
    time: number;
    success: boolean;
    error?: string;
  };
  
  const sceneResults: SceneResult[] = [];
  
  for (let index = 0; index < scenes.length; index++) {
    const sceneDescription = scenes[index]!;
    const sceneStartTime = Date.now();
    console.log(`   [${index + 1}/${scenes.length}] Generating: "${sceneDescription.slice(0, 50)}${sceneDescription.length > 50 ? '...' : ''}"`);

    try {
      let prompt = sceneDescription;

      if (characterDescription) {
        prompt = `${characterDescription}. ${prompt}`;
      }

      if (style) {
        prompt = `${style} style: ${prompt}`;
      }

      let result;
      if (loadedReferences && loadedReferences.length > 0) {
        result = await provider.generateVideoWithReferences(
          prompt,
          loadedReferences,
          {
            aspectRatio,
            resolution: '720p',
            duration: 8,
            numberOfVideos: 1,
          }
        );
      } else {
        result = await provider.generateVideo(prompt, {
          aspectRatio,
          resolution: '720p',
          duration: 8,
          numberOfVideos: 1,
        });
      }

      const tempPath = join(tmpdir(), `scene-${index}-${Date.now()}.mp4`);
      await writeFile(tempPath, result.buffer);

      const sceneTime = Date.now() - sceneStartTime;
      console.log(`   ✅ [${index + 1}/${scenes.length}] Completed in ${(sceneTime / 1000).toFixed(1)}s`);

      sceneResults.push({
        index,
        path: tempPath,
        time: sceneTime,
        success: true,
      });
    } catch (error) {
      const sceneTime = Date.now() - sceneStartTime;
      console.error(`   ❌ [${index + 1}/${scenes.length}] Failed after ${(sceneTime / 1000).toFixed(1)}s:`, error);

      sceneResults.push({
        index,
        path: null,
        time: sceneTime,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

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
