import { GeminiProvider } from './src/providers/gemini.js';
import * as fs from 'fs/promises';

async function analyzeScreenshot() {
  console.log('🔍 Analyzing Screenshot...\n');
  
  const provider = new GeminiProvider();
  const imagePath = '/Volumes/DevHub_ext/factory/toolbox/opencode-nanobanana/generated-assets/screenshots/IMG_3619.jpg';
  
  console.log(`📁 Image: ${imagePath}\n`);
  
  const imageBuffer = await fs.readFile(imagePath);
  console.log(`📦 Size: ${(imageBuffer.length / 1024).toFixed(1)}KB\n`);
  
  const question = `Analyze this UI screenshot in detail. Please provide:

1. **OVERVIEW**: What app/screen is this? What is its purpose?

2. **WHAT'S GOOD** ✅:
   - Layout and composition
   - Typography and readability
   - Color scheme and contrast
   - Visual hierarchy
   - User experience elements

3. **WHAT NEEDS IMPROVEMENT** ❌:
   - Accessibility issues
   - Design inconsistencies
   - Usability problems
   - Visual clutter or confusion
   - Missing elements

4. **SPECIFIC RECOMMENDATIONS**:
   - Actionable suggestions to improve the UI

Be specific and reference actual elements you see in the screenshot.`;

  console.log('⏳ Analyzing with AI vision...\n');
  
  const startTime = Date.now();
  const analysis = await provider.analyzeImage(imageBuffer, question);
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log(`✅ Analysis complete in ${duration}s\n`);
  console.log('━'.repeat(60));
  console.log('\n' + analysis + '\n');
  console.log('━'.repeat(60));
}

analyzeScreenshot().catch(console.error);
