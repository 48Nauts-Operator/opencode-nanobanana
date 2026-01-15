/**
 * Image to Video Tool
 *
 * Animates an image into a video using Veo 3.1 with native audio support.
 */

import { GeminiProvider } from '../../providers/gemini.js';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

export interface ImageToVideoOptions {
  /** Path to the image to animate */
  imagePath: string;
  /** Description of the animation */
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

export interface ImageToVideoResult {
  /** Path to the generated video */
  videoPath: string;
  /** Generation time in milliseconds */
  generationTime: number;
}

/**
 * Animate an image into a video
 *
 * This function uses Veo 3.1 to animate a static image with motion described
 * by the prompt. The model supports native audio generation, multiple resolutions,
 * and configurable durations.
 *
 * @param options - Configuration options for image animation
 * @returns Result object with video path and timing information
 *
 * @example
 * Basic usage:
 * ```typescript
 * const result = await imageToVideo({
 *   apiKey: 'your-api-key',
 *   imagePath: './landscape.jpg',
 *   prompt: 'Slow camera pan from left to right',
 *   outputPath: './animated-landscape.mp4'
 * });
 * ```
 *
 * @example
 * Product showcase with audio:
 * ```typescript
 * const result = await imageToVideo({
 *   apiKey: 'your-api-key',
 *   imagePath: './product.png',
 *   prompt: 'Product rotates 360 degrees on a pedestal',
 *   resolution: '1080p',
 *   duration: 6,
 *   generateAudio: true
 * });
 * ```
 *
 * @example
 * Portrait animation:
 * ```typescript
 * const result = await imageToVideo({
 *   apiKey: 'your-api-key',
 *   imagePath: './portrait.jpg',
 *   prompt: 'Subtle breathing motion and eye blinks',
 *   aspectRatio: '9:16',
 *   duration: 4
 * });
 * ```
 */
export async function imageToVideo(
  options: ImageToVideoOptions
): Promise<ImageToVideoResult> {
  const startTime = Date.now();

  const {
    imagePath,
    prompt,
    aspectRatio = '16:9',
    resolution = '720p',
    duration = 8,
    generateAudio = true,
    outputPath,
    apiKey,
  } = options;

  console.log('🎬 Animating image to video...');
  console.log(`   Image: ${imagePath}`);
  console.log(`   Prompt: ${prompt}`);
  console.log(`   Resolution: ${resolution}`);
  console.log(`   Duration: ${duration}s`);
  console.log(`   Aspect Ratio: ${aspectRatio}`);
  console.log(`   Audio: ${generateAudio ? 'enabled' : 'disabled'}`);

  // Initialize provider
  const provider = new GeminiProvider(apiKey);

  try {
    // Read the input image
    console.log('   Loading image...');
    const imageBuffer = await readFile(imagePath);

    // Animate the image
    console.log('   Animating with Veo 3.1...');
    const result = await provider.animateImage(imageBuffer, prompt, {
      aspectRatio,
      resolution,
      duration,
      generateAudio,
    });

    // Determine output path
    const finalOutputPath =
      outputPath || join(tmpdir(), `animated-${Date.now()}.mp4`);

    // Write the video
    console.log('   Saving video...');
    await writeFile(finalOutputPath, result.buffer);

    const totalTime = Date.now() - startTime;

    console.log(`✨ Image animation complete!`);
    console.log(`   Output: ${finalOutputPath}`);
    console.log(`   Generation time: ${(totalTime / 1000).toFixed(2)}s`);

    return {
      videoPath: finalOutputPath,
      generationTime: totalTime,
    };
  } catch (error) {
    console.error('❌ Image animation failed:', error);
    throw error;
  }
}
