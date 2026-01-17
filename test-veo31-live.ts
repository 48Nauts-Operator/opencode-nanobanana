/**
 * Live test for Veo 3.1 API - Storyboard Video Generation
 * 
 * Tests:
 * 1. Single video generation with Veo 3.1 (with audio)
 * 2. Multi-scene storyboard generation
 * 3. Video with reference images (if supported)
 */

import { GeminiProvider } from './src/providers/gemini.js';
import { generateStoryboardVideo } from './src/tools/video/storyboard-video.js';
import { writeFile } from 'fs/promises';
import { join } from 'path';

const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDROqIj3wBKod1ks16MI9rwo7BZipqug9w';
const OUTPUT_DIR = './generated-assets/veo31-tests';

async function ensureDir(dir: string) {
  const fs = await import('fs/promises');
  await fs.mkdir(dir, { recursive: true });
}

async function testSingleVideoGeneration() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 1: Single Video Generation with Veo 3.1');
  console.log('='.repeat(60));

  const provider = new GeminiProvider(API_KEY);

  try {
    console.log('\nGenerating video with native audio...');
    console.log('Prompt: "A cat playing with a ball of yarn in a sunny living room"');
    console.log('Options: 720p, 8 seconds, audio enabled\n');

    const result = await provider.generateVideo(
      'A cat playing with a ball of yarn in a sunny living room',
      {
        aspectRatio: '16:9',
        resolution: '720p',
        duration: 8,
        generateAudio: true,
      }
    );

    const outputPath = join(OUTPUT_DIR, 'test1-cat-yarn.mp4');
    await writeFile(outputPath, result.buffer);

    console.log(`\n✅ SUCCESS: Video generated in ${(result.generationTime / 1000).toFixed(1)}s`);
    console.log(`   Output: ${outputPath}`);
    console.log(`   Size: ${(result.buffer.length / 1024 / 1024).toFixed(2)} MB`);
    
    return true;
  } catch (error) {
    console.error('\n❌ FAILED:', error);
    return false;
  }
}

async function testStoryboardGeneration() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 2: Storyboard Video Generation (3 scenes)');
  console.log('='.repeat(60));

  try {
    console.log('\nGenerating 3-scene storyboard...');
    console.log('Style: cinematic');
    console.log('Transition: crossfade (0.5s)');
    console.log('Scenes:');
    console.log('  1. Sunrise over a misty mountain');
    console.log('  2. A hiker climbing a rocky trail');
    console.log('  3. Panoramic view from the summit\n');

    const result = await generateStoryboardVideo({
      apiKey: API_KEY,
      scenes: [
        'Sunrise over a misty mountain, golden light breaking through clouds',
        'A hiker climbing a rocky trail, determination on their face',
        'Panoramic view from the summit, endless mountains in the distance'
      ],
      style: 'cinematic',
      aspectRatio: '16:9',
      transition: 'crossfade',
      transitionDuration: 0.5,
      generateAudio: true,
      outputPath: join(OUTPUT_DIR, 'test2-mountain-journey.mp4'),
    });

    console.log(`\n✅ SUCCESS: Storyboard generated`);
    console.log(`   Output: ${result.videoPath}`);
    console.log(`   Total time: ${(result.totalTime / 1000).toFixed(1)}s`);
    console.log(`   Scenes: ${result.successCount}/${result.successCount + result.failureCount}`);
    console.log('   Per-scene times:');
    result.sceneTimes.forEach(st => {
      console.log(`     Scene ${st.scene}: ${(st.time / 1000).toFixed(1)}s`);
    });
    
    return true;
  } catch (error) {
    console.error('\n❌ FAILED:', error);
    return false;
  }
}

async function testProductCommercial() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 3: Product Commercial (5 scenes with character)');
  console.log('='.repeat(60));

  try {
    console.log('\nGenerating product commercial...');
    console.log('Style: commercial advertising');
    console.log('Character: A fit woman in athletic wear');
    console.log('Scenes: 5 scenes showing product usage\n');

    const result = await generateStoryboardVideo({
      apiKey: API_KEY,
      scenes: [
        'Woman enters a modern kitchen, morning light streaming through windows',
        'She picks up a sports nutrition container, examining the label',
        'Close-up of hands mixing the powder with water in a shaker',
        'Woman drinks the shake with a satisfied expression',
        'Wide shot, she gives a thumbs up with energy and enthusiasm'
      ],
      style: 'commercial advertising, bright and energetic',
      characterDescription: 'A fit woman in her 30s with brown hair, wearing blue athletic wear',
      aspectRatio: '16:9',
      transition: 'crossfade',
      transitionDuration: 0.3,
      generateAudio: true,
      outputPath: join(OUTPUT_DIR, 'test3-product-commercial.mp4'),
    });

    console.log(`\n✅ SUCCESS: Commercial generated`);
    console.log(`   Output: ${result.videoPath}`);
    console.log(`   Total time: ${(result.totalTime / 1000).toFixed(1)}s`);
    console.log(`   Scenes: ${result.successCount}/${result.successCount + result.failureCount}`);
    
    return true;
  } catch (error) {
    console.error('\n❌ FAILED:', error);
    return false;
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('VEO 3.1 LIVE API TESTS');
  console.log('='.repeat(60));
  console.log(`\nAPI Key: ${API_KEY.slice(0, 10)}...${API_KEY.slice(-4)}`);
  console.log(`Output Directory: ${OUTPUT_DIR}`);

  await ensureDir(OUTPUT_DIR);

  const results: Record<string, boolean> = {};

  // Test 1: Single video
  results['Single Video'] = await testSingleVideoGeneration();

  // Test 2: Storyboard (3 scenes)
  results['Storyboard (3 scenes)'] = await testStoryboardGeneration();

  // Test 3: Product commercial (5 scenes with character)
  // Commenting out to save API costs - uncomment if needed
  // results['Product Commercial'] = await testProductCommercial();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  
  let passed = 0;
  let failed = 0;
  
  for (const [test, success] of Object.entries(results)) {
    const status = success ? '✅ PASSED' : '❌ FAILED';
    console.log(`  ${test}: ${status}`);
    if (success) passed++;
    else failed++;
  }
  
  console.log(`\nTotal: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(60));
  
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);
