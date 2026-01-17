import { generateStoryboardVideo } from './src/tools/video/storyboard-video.js';
import { join } from 'path';
import { mkdir } from 'fs/promises';

const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDROqIj3wBKod1ks16MI9rwo7BZipqug9w';
const OUTPUT_DIR = './generated-assets/princess-emma';

async function main() {
  console.log('\n🏰 Princess Emma and Fifi - Full Story\n');
  
  await mkdir(OUTPUT_DIR, { recursive: true });

  const result = await generateStoryboardVideo({
    apiKey: API_KEY,
    characterDescription: 'Princess Emma, a sweet toddler girl around 3 years old with chin-length wavy blonde hair, small pink flower hair clips on each side, big round blue-green eyes, rosy cheeks, and a gentle smile, wearing a flowing pink princess dress with puffy sleeves, accompanied by her fluffy small white dog Fifi',
    style: 'magical fairy tale animation, soft pastel watercolor style, enchanted storybook illustration, warm lighting',
    scenes: [
      'A beautiful white castle with bright pink cone-shaped roofs and towers, surrounded by lush green gardens with colorful flowers and tiny glowing fairies flying around in the morning sunlight',
      'Princess Emma and her fluffy white dog Fifi happily walk out through the grand castle doors into the sunny magical garden, birds singing in the trees',
      'A tiny blue fairy named Aqua with sparkling translucent wings flies up to Princess Emma looking worried, pointing at the tall grass and explaining something',
      'Princess Emma kneels down in the tall green grass near an old stone fountain, searching carefully while Fifi sniffs around helping to look',
      'Fifi barks excitedly and wags his tail as he finds a glowing blue gemstone near the fountain, Princess Emma picks it up with wonder in her eyes',
      'Princess Emma gently hands the shimmering blue Aqua Stone to the grateful fairy Aqua, both smiling with joy as sparkles surround them',
      'The fairy Aqua waves her tiny wand and magical sparkles spread everywhere, all the flowers bloom in vibrant colors, trees sparkle with magic, butterflies appear, the garden transforms into a paradise'
    ],
    aspectRatio: '16:9',
    transition: 'crossfade',
    transitionDuration: 0.8,
    outputPath: join(OUTPUT_DIR, 'princess-emma-full-story.mp4'),
  });

  console.log(`\n✨ Story complete!`);
  console.log(`📁 Video: ${result.videoPath}`);
  console.log(`⏱️  Total time: ${(result.totalTime / 1000 / 60).toFixed(1)} minutes`);
  console.log(`🎬 Scenes: ${result.successCount}/${result.successCount + result.failureCount}`);
}

main().catch(console.error);
