import { GeminiProvider } from './src/providers/gemini.js';
import { saveImage } from './src/utils/file-handler.js';
import * as fs from 'fs/promises';

async function runTests() {
  console.log('🧪 FULL PLUGIN TEST SUITE\n');
  console.log('=' .repeat(50));
  
  const provider = new GeminiProvider();
  const results: {test: string, status: string, time: string}[] = [];
  
  // Test 1: Image Generation
  console.log('\n1️⃣  Testing generate_image...');
  try {
    const start = Date.now();
    const images = await provider.generateImage('A simple blue circle icon, minimal', { count: 1 });
    const time = ((Date.now() - start) / 1000).toFixed(1);
    await saveImage(images[0], './test-output', 'test-generate', 0);
    results.push({test: 'generate_image', status: '✅ PASS', time: `${time}s`});
    console.log(`   ✅ Generated image in ${time}s`);
  } catch (e: any) {
    results.push({test: 'generate_image', status: '❌ FAIL', time: e.message});
    console.log(`   ❌ Failed: ${e.message}`);
  }

  // Test 2: Image Analysis
  console.log('\n2️⃣  Testing analyze_image...');
  try {
    const start = Date.now();
    const testImage = await fs.readFile('./test-output/test-generate.png');
    const analysis = await provider.analyzeImage(testImage, 'What color is this shape?');
    const time = ((Date.now() - start) / 1000).toFixed(1);
    results.push({test: 'analyze_image', status: '✅ PASS', time: `${time}s`});
    console.log(`   ✅ Analyzed in ${time}s: "${analysis.substring(0, 50)}..."`);
  } catch (e: any) {
    results.push({test: 'analyze_image', status: '❌ FAIL', time: e.message});
    console.log(`   ❌ Failed: ${e.message}`);
  }

  // Test 3: Image Editing
  console.log('\n3️⃣  Testing edit_image...');
  try {
    const start = Date.now();
    const testImage = await fs.readFile('./test-output/test-generate.png');
    const edited = await provider.editImage(testImage, 'Make the circle red instead of blue');
    const time = ((Date.now() - start) / 1000).toFixed(1);
    await saveImage(edited, './test-output', 'test-edit', 0);
    results.push({test: 'edit_image', status: '✅ PASS', time: `${time}s`});
    console.log(`   ✅ Edited image in ${time}s`);
  } catch (e: any) {
    results.push({test: 'edit_image', status: '❌ FAIL', time: e.message});
    console.log(`   ❌ Failed: ${e.message}`);
  }

  // Test 4: Video Generation
  console.log('\n4️⃣  Testing generate_video...');
  try {
    const start = Date.now();
    const video = await provider.generateVideo('A simple animation of a bouncing ball');
    const time = ((Date.now() - start) / 1000).toFixed(1);
    await fs.writeFile('./test-output/test-video.mp4', video);
    results.push({test: 'generate_video', status: '✅ PASS', time: `${time}s`});
    console.log(`   ✅ Generated video in ${time}s (${(video.length/1024/1024).toFixed(1)}MB)`);
  } catch (e: any) {
    results.push({test: 'generate_video', status: '❌ FAIL', time: e.message});
    console.log(`   ❌ Failed: ${e.message}`);
  }

  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log('📊 TEST RESULTS SUMMARY\n');
  console.log('| Test           | Status  | Time    |');
  console.log('|----------------|---------|---------|');
  for (const r of results) {
    console.log(`| ${r.test.padEnd(14)} | ${r.status.padEnd(7)} | ${r.time.padEnd(7)} |`);
  }
  
  const passed = results.filter(r => r.status.includes('PASS')).length;
  console.log(`\n${passed}/${results.length} tests passed`);
  
  if (passed === results.length) {
    console.log('\n🎉 ALL TESTS PASSED - Plugin is ready for production!');
  } else {
    console.log('\n⚠️  Some tests failed - review before merging');
  }
}

fs.mkdir('./test-output', { recursive: true }).then(() => runTests()).catch(console.error);
