import { GeminiProvider } from '../../providers/gemini.js';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

export interface GenerateVideoOptions {
  prompt: string;
  aspectRatio?: '16:9' | '9:16';
  resolution?: '720p' | '1080p';
  duration?: 4 | 6 | 8;
  outputPath?: string;
  apiKey: string;
}

export interface GenerateVideoResult {
  videoPath: string;
  generationTime: number;
}

export async function generateVideo(
  options: GenerateVideoOptions
): Promise<GenerateVideoResult> {
  const startTime = Date.now();

  const {
    prompt,
    aspectRatio = '16:9',
    resolution = '720p',
    duration = 8,
    outputPath,
    apiKey,
  } = options;

  console.log('🎬 Generating video...');
  console.log(`   Prompt: ${prompt}`);
  console.log(`   Resolution: ${resolution}`);
  console.log(`   Duration: ${duration}s`);
  console.log(`   Aspect Ratio: ${aspectRatio}`);
  console.log(`   Audio: native (Veo 3.0)`);

  const provider = new GeminiProvider(apiKey);

  try {
    console.log('   Generating with Veo 3.0...');
    const result = await provider.generateVideo(prompt, {
      aspectRatio,
      resolution,
      duration,
    });

    const finalOutputPath = outputPath || join(tmpdir(), `video-${Date.now()}.mp4`);

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
