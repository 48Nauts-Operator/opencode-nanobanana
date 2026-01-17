import { generateStoryboardVideo } from './src/tools/video/storyboard-video.js';
import { join } from 'path';
import { mkdir } from 'fs/promises';

const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDROqIj3wBKod1ks16MI9rwo7BZipqug9w';
const OUTPUT_DIR = './generated-assets/princess-emma';

async function main() {
  console.log('\n🏰 Princess Emma and Fifi - Storyboard Video Test\n');
  
  await mkdir(OUTPUT_DIR, { recursive: true });

  const result = await generateStoryboardVideo({
    apiKey: API_KEY,
    characterDescription: 'Princess Emma, a young girl with golden hair wearing a pink princess dress, and her fluffy white dog Fifi',
    style: 'magical fairy tale animation, soft dreamy colors, enchanted atmosphere',
    scenes: [
      'A beautiful white castle with pink cone towers surrounded by lush green gardens, flowers, and tiny glowing fairies flying around',
      'Princess Emma and her fluffy white dog Fifi walk out of the castle door into the sunny garden, birds singing',
      'A tiny blue fairy named Aqua with sparkling wings flies up to Princess Emma, looking worried and pointing at the tall grass',
      'Princess Emma and Fifi search through the tall grass near a stone fountain, looking carefully for something',
      'Fifi finds a glowing blue Aqua Stone near the fountain, barking happily while Princess Emma picks it up',
      'Princess Emma hands the blue stone to the grateful fairy Aqua, everyone smiling with joy',
      'The fairy waves her wand and all the flowers bloom, trees sparkle with magic, the garden transforms into a paradise'
    ],
    aspectRatio: '16:9',
    transition: 'crossfade',
    transitionDuration: 0.8,
    outputPath: join(OUTPUT_DIR, 'princess-emma-and-fifi.mp4'),
  });

  console.log(`\n✨ Story complete!`);
  console.log(`📁 Video: ${result.videoPath}`);
  console.log(`⏱️  Total time: ${(result.totalTime / 1000 / 60).toFixed(1)} minutes`);
  console.log(`🎬 Scenes: ${result.successCount}/${result.successCount + result.failureCount}`);
}

main().catch(console.error);
