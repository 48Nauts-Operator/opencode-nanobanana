/**
 * Generate Video Tool
 *
 * Generates a video from a text prompt using Veo 3.1 with native audio support.
 */

import { GeminiProvider } from '../../providers/gemini.js';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

export interface GenerateVideoOptions {
  /** Description of the video to generate */
  prompt: string;
  /** Aspect ratio for the video (default: '16:9') */
  aspectRatio?: '16:9' | '9:16' | '1:1';
  /** Resolution for the video (default: '720p') */
  resolution?: '720p' | '1080p';
  /** Video duration in seconds (default: 8) */
  duration?: 4 | 6 | 8;
  /** Enable native audio generation (default: true) */
  generateAudio?: boolean;
  /** Output path for the video (optional, defaults to temp file) */
  outputPath?: string;
  /** Gemini API key */
  apiKey: string;
}

export interface GenerateVideoResult {
  /** Path to the generated video */
  videoPath: string;
  /** Generation time in milliseconds */
  generationTime: number;
}

/**
 * Generate a video from a text prompt
 *
 * This function uses Veo 3.1 to generate a video from a text description.
 * The model supports native audio generation, multiple resolutions, and
 * configurable durations.
 *
 * @param options - Configuration options for video generation
 * @returns Result object with video path and timing information
 *
 * @example
 * Basic usage:
 * ```typescript
 * const result = await generateVideo({
 *   apiKey: 'your-api-key',
 *   prompt: 'A serene mountain landscape at sunrise',
 *   outputPath: './mountain-sunrise.mp4'
 * });
 * ```
 *
 * @example
 * High quality with custom settings:
 * ```typescript
 * const result = await generateVideo({
 *   apiKey: 'your-api-key',
 *   prompt: 'A bustling city street at night with neon lights',
 *   resolution: '1080p',
 *   duration: 8,
 *   aspectRatio: '16:9',
 *   generateAudio: true
 * });
 * ```
 *
 * @example
 * Silent video:
 * ```typescript
 * const result = await generateVideo({
 *   apiKey: 'your-api-key',
 *   prompt: 'A peaceful garden with blooming flowers',
 *   generateAudio: false
 * });
 * ```
 */
export async function generateVideo(
  options: GenerateVideoOptions
): Promise<GenerateVideoResult> {
  const startTime = Date.now();

  const {
    prompt,
    aspectRatio = '16:9',
    resolution = '720p',
    duration = 8,
    generateAudio = true,
    outputPath,
    apiKey,
  } = options;

  console.log('🎬 Generating video...');
  console.log(`   Prompt: ${prompt}`);
  console.log(`   Resolution: ${resolution}`);
  console.log(`   Duration: ${duration}s`);
  console.log(`   Aspect Ratio: ${aspectRatio}`);
  console.log(`   Audio: ${generateAudio ? 'enabled' : 'disabled'}`);

  // Initialize provider
  const provider = new GeminiProvider(apiKey);

  try {
    // Generate the video
    console.log('   Generating with Veo 3.1...');
    const result = await provider.generateVideo(prompt, {
      aspectRatio,
      resolution,
      duration,
      generateAudio,
    });

    // Determine output path
    const finalOutputPath =
      outputPath || join(tmpdir(), `video-${Date.now()}.mp4`);

    // Write the video
    console.log('   Saving video...');
    await writeFile(finalOutputPath, result.buffer);

    const totalTime = Date.now() - startTime;

    console.log(`✨ Video generation complete!`);
    console.log(`   Output: ${finalOutputPath}`);
    console.log(`   Generation time: ${(totalTime / 1000).toFixed(2)}s`);

    return {
      videoPath: finalOutputPath,
      generationTime: totalTime,
    };
  } catch (error) {
    console.error('❌ Video generation failed:', error);
    throw error;
  }
}
