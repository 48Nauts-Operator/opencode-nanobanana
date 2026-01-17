import { GeminiProvider } from '../../providers/gemini.js';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

export interface ExtendVideoOptions {
  videoPath: string;
  prompt: string;
  aspectRatio?: '16:9' | '9:16';
  resolution?: '720p' | '1080p';
  outputPath?: string;
  apiKey: string;
}

export interface ExtendVideoResult {
  videoPath: string;
  generationTime: number;
}

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

  const provider = new GeminiProvider(apiKey);

  try {
    console.log('   Loading video...');
    const videoBuffer = await readFile(videoPath);

    console.log('   Generating extension...');
    const result = await provider.extendVideo(videoBuffer, prompt, {
      aspectRatio,
      resolution,
    });

    const finalOutputPath = outputPath || join(tmpdir(), `extended-${Date.now()}.mp4`);

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
