import { GeminiProvider } from './src/providers/gemini.js';
import { saveImage } from './src/utils/file-handler.js';

async function generateCatSunset() {
  console.log('🐱 Generating cat at sunset beach...\n');
  
  const provider = new GeminiProvider();
  
  const prompt = 'A silhouette of a cat sitting peacefully on a sandy beach, facing a beautiful vibrant sunset over the ocean, warm orange and pink sky colors reflecting on calm waves, golden hour lighting, serene and tranquil atmosphere, photorealistic style, wide-angle composition';
  
  console.log('📝 Prompt:', prompt);
  console.log('⏳ Generating...\n');
  
  const startTime = Date.now();
  const images = await provider.generateImage(prompt, { 
    aspectRatio: '16:9', 
    count: 1 
  });
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log(`✅ Generated in ${duration}s`);
  console.log(`📦 Size: ${(images[0].length / 1024).toFixed(1)}KB\n`);
  
  const outputPath = await saveImage(images[0], './generated-assets', 'cat-sunset-beach', 0);
  console.log(`💾 Saved to: ${outputPath}`);
  
  console.log('\n🎉 Done! Your peaceful sunset scene is ready.');
}

generateCatSunset().catch(console.error);
