import { GeminiProvider } from '../../providers/gemini.js';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

export interface ImageToVideoOptions {
  imagePath: string;
  prompt: string;
  aspectRatio?: '16:9' | '9:16';
  resolution?: '720p' | '1080p';
  duration?: 4 | 6 | 8;
  outputPath?: string;
  apiKey: string;
}

export interface ImageToVideoResult {
  videoPath: string;
  generationTime: number;
}

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
    outputPath,
    apiKey,
  } = options;

  console.log('🎬 Animating image to video...');
  console.log(`   Image: ${imagePath}`);
  console.log(`   Prompt: ${prompt}`);
  console.log(`   Resolution: ${resolution}`);
  console.log(`   Duration: ${duration}s`);
  console.log(`   Aspect Ratio: ${aspectRatio}`);
  console.log(`   Audio: native (Veo 3.0)`);

  const provider = new GeminiProvider(apiKey);

  try {
    console.log('   Loading image...');
    const imageBuffer = await readFile(imagePath);

    console.log('   Animating with Veo 3.0...');
    const result = await provider.animateImage(imageBuffer, prompt, {
      aspectRatio,
      resolution,
      duration,
    });

    const finalOutputPath = outputPath || join(tmpdir(), `animated-${Date.now()}.mp4`);

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
