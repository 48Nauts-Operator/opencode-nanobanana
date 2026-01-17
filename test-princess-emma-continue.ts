import { generateStoryboardVideo } from './src/tools/video/storyboard-video.js';
import { join } from 'path';
import { mkdir } from 'fs/promises';

const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDROqIj3wBKod1ks16MI9rwo7BZipqug9w';
const OUTPUT_DIR = './generated-assets/princess-emma';

async function main() {
  console.log('\n🏰 Princess Emma - Remaining Scenes (4-7)\n');
  
  await mkdir(OUTPUT_DIR, { recursive: true });

  const result = await generateStoryboardVideo({
    apiKey: API_KEY,
    characterDescription: 'Princess Emma, a sweet toddler girl around 3 years old with chin-length wavy blonde hair, small pink flower hair clips on each side, big round blue-green eyes, rosy cheeks, and a gentle smile, wearing a flowing pink princess dress with puffy sleeves, accompanied by her fluffy small white dog Fifi',
    style: 'magical fairy tale animation, soft pastel watercolor style, enchanted storybook illustration, warm lighting',
    scenes: [
      'Princess Emma kneels down in the tall green grass near an old stone fountain, searching carefully while her fluffy white dog Fifi sniffs around helping to look for something',
      'Fifi the white dog barks excitedly and wags his tail as he finds a glowing blue gemstone near the fountain, Princess Emma picks it up with wonder in her eyes',
      'Princess Emma gently hands the shimmering blue Aqua Stone to the grateful tiny blue fairy Aqua, both smiling with joy as magical sparkles surround them',
      'The fairy Aqua waves her tiny wand and magical sparkles spread everywhere, all the flowers bloom in vibrant colors, trees sparkle with magic, butterflies appear, the garden transforms into a paradise'
    ],
    aspectRatio: '16:9',
    transition: 'crossfade',
    transitionDuration: 0.8,
    outputPath: join(OUTPUT_DIR, 'princess-emma-part2.mp4'),
  });

  console.log(`\n✨ Part 2 complete!`);
  console.log(`📁 Video: ${result.videoPath}`);
  console.log(`⏱️  Total time: ${(result.totalTime / 1000 / 60).toFixed(1)} minutes`);
  console.log(`🎬 Scenes: ${result.successCount}/${result.successCount + result.failureCount}`);
}

main().catch(console.error);
