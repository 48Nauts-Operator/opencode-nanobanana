import { generateStoryboardVideo } from './src/tools/video/storyboard-video.js';
import { join } from 'path';
import { mkdir } from 'fs/promises';

const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDROqIj3wBKod1ks16MI9rwo7BZipqug9w';
const OUTPUT_DIR = './generated-assets/princess-emma';

async function main() {
  console.log('\n🏰 Princess Emma - Short Test (2 scenes)\n');
  
  await mkdir(OUTPUT_DIR, { recursive: true });

  const result = await generateStoryboardVideo({
    apiKey: API_KEY,
    characterDescription: 'Princess Emma, a young girl with golden hair wearing a pink princess dress, and her fluffy white dog Fifi',
    style: 'magical fairy tale animation, soft dreamy colors',
    scenes: [
      'A beautiful white castle with pink cone towers surrounded by lush green gardens and tiny glowing fairies',
      'Princess Emma and her fluffy white dog Fifi walk out of the castle into the sunny garden'
    ],
    aspectRatio: '16:9',
    transition: 'crossfade',
    transitionDuration: 0.5,
    outputPath: join(OUTPUT_DIR, 'princess-emma-short-test.mp4'),
  });

  console.log(`\n✨ Test complete!`);
  console.log(`📁 Video: ${result.videoPath}`);
  console.log(`⏱️  Total time: ${(result.totalTime / 1000 / 60).toFixed(1)} minutes`);
}

main().catch(console.error);
