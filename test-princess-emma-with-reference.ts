import { generateStoryboardVideo } from './src/tools/video/storyboard-video.js';
import { join } from 'path';
import { mkdir } from 'fs/promises';

const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDROqIj3wBKod1ks16MI9rwo7BZipqug9w';
const OUTPUT_DIR = './generated-assets/princess-emma';
const REFERENCE_IMAGE = './generated-assets/princess-emma/IMG_3609.jpeg';

async function main() {
  console.log('\n🏰 Princess Emma with Reference Image Test\n');
  
  await mkdir(OUTPUT_DIR, { recursive: true });

  const result = await generateStoryboardVideo({
    apiKey: API_KEY,
    characterDescription: 'Princess Emma, a young toddler girl with short blonde wavy hair and pink hair clips, wearing a pink princess dress, with her fluffy white small dog Fifi',
    style: 'magical fairy tale animation, soft pastel colors, enchanted storybook illustration',
    referenceImages: [REFERENCE_IMAGE],
    scenes: [
      'A beautiful white castle with bright pink cone-shaped roofs, surrounded by lush green gardens with colorful flowers and tiny glowing fairies flying around',
      'Princess Emma and her fluffy white dog Fifi happily walk out of the castle gate into the sunny magical garden, birds singing'
    ],
    aspectRatio: '16:9',
    transition: 'crossfade',
    transitionDuration: 0.5,
    outputPath: join(OUTPUT_DIR, 'princess-emma-with-reference.mp4'),
  });

  console.log(`\n✨ Test complete!`);
  console.log(`📁 Video: ${result.videoPath}`);
  console.log(`⏱️  Total time: ${(result.totalTime / 1000 / 60).toFixed(1)} minutes`);
}

main().catch(console.error);
