import { GeminiProvider } from './src/providers/gemini.js';
import { saveImage } from './src/utils/file-handler.js';

async function generateIcon() {
  console.log('🎨 Generating modern app icon...\n');
  
  const provider = new GeminiProvider();
  
  const prompt = 'A modern app icon with gradient colors, minimalist design, rounded square shape, professional and clean aesthetic, vibrant blue and purple gradient';
  
  console.log('📝 Prompt:', prompt);
  console.log('⏳ Generating...\n');
  
  const startTime = Date.now();
  const images = await provider.generateImage(prompt, { 
    aspectRatio: '1:1', 
    count: 1 
  });
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log(`✅ Generated in ${duration}s`);
  console.log(`📦 Size: ${(images[0].length / 1024).toFixed(1)}KB\n`);
  
  const outputPath = await saveImage(images[0], './generated-assets', 'modern-app-icon', 0);
  console.log(`💾 Saved to: ${outputPath}`);
  
  console.log('\n🎉 Done! Your modern app icon is ready.');
}

generateIcon().catch(console.error);
