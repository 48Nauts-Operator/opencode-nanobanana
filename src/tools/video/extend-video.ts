/**
 * Extend Video Tool
 *
 * Extends an existing video with new content using Veo 3.1's video extension API.
 */

import { GeminiProvider } from '../../providers/gemini.js';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

export interface ExtendVideoOptions {
  /** Path to the existing video to extend */
  videoPath: string;
  /** Description of the extension content */
  prompt: string;
  /** Aspect ratio for the extended video (default: '16:9') */
  aspectRatio?: '16:9' | '9:16' | '1:1';
  /** Resolution for the extended video (default: '720p') */
  resolution?: '720p' | '1080p';
  /** Output path for the extended video (optional, defaults to temp file) */
  outputPath?: string;
  /** Gemini API key */
  apiKey: string;
}

export interface ExtendVideoResult {
  /** Path to the extended video */
  videoPath: string;
  /** Generation time in milliseconds */
  generationTime: number;
}

/**
 * Extend an existing video with new content
 *
 * This function uses Veo 3.1's video extension feature to seamlessly extend
 * an existing video with new content described by the prompt. The extension
 * maintains visual consistency with the original video.
 *
 * @param options - Configuration options for video extension
 * @returns Result object with extended video path and timing information
 *
 * @example
 * Basic usage:
 * ```typescript
 * const result = await extendVideo({
 *   apiKey: 'your-api-key',
 *   videoPath: './original-video.mp4',
 *   prompt: 'The camera pans to reveal a stunning sunset over the ocean',
 *   outputPath: './extended-video.mp4'
 * });
 * ```
 *
 * @example
 * With custom resolution:
 * ```typescript
 * const result = await extendVideo({
 *   apiKey: 'your-api-key',
 *   videoPath: './intro.mp4',
 *   prompt: 'Text appears: "Welcome to our product demo"',
 *   resolution: '1080p',
 *   aspectRatio: '16:9'
 * });
 * ```
 */
export async function extendVideo(
  options: ExtendVideoOptions
): Promise<ExtendVideoResult> {
  const startTime = Date.now();

  const {
    videoPath,
    prompt,
    aspectRatio = '16:9',
    resolution = '720p',
    outputPath,
    apiKey,
  } = options;

  console.log('🎬 Extending video...');
  console.log(`   Video: ${videoPath}`);
  console.log(`   Prompt: ${prompt}`);
  console.log(`   Resolution: ${resolution}`);
  console.log(`   Aspect Ratio: ${aspectRatio}`);

  // Initialize provider
  const provider = new GeminiProvider(apiKey);

  try {
    // Read the input video
    console.log('   Loading video...');
    const videoBuffer = await readFile(videoPath);

    // Extend the video
    console.log('   Generating extension...');
    const result = await provider.extendVideo(videoBuffer, prompt, {
      aspectRatio,
      resolution,
    });

    // Determine output path
    const finalOutputPath =
      outputPath || join(tmpdir(), `extended-${Date.now()}.mp4`);

    // Write the extended video
    console.log('   Saving extended video...');
    await writeFile(finalOutputPath, result.buffer);

    const totalTime = Date.now() - startTime;

    console.log(`✨ Video extension complete!`);
    console.log(`   Output: ${finalOutputPath}`);
    console.log(`   Generation time: ${(totalTime / 1000).toFixed(2)}s`);

    return {
      videoPath: finalOutputPath,
      generationTime: totalTime,
    };
  } catch (error) {
    console.error('❌ Video extension failed:', error);
    throw error;
  }
}
