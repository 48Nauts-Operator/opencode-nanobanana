import { GeminiProvider } from './src/providers/gemini.js';
import { saveImage } from './src/utils/file-handler.js';

async function generateRalphDroid() {
  console.log('🤖 Generating Ralph Wiggum in Cyberpunk Droid Suit...\n');
  
  const provider = new GeminiProvider();
  
  const prompt = 'A chubby cartoon character with a round face and buck teeth wearing a futuristic cyberpunk droid suit, neon purple and orange colors, mechanical armor with glowing circuits, retro-futuristic aesthetic, digital art style, detailed tech armor, cheerful expression';
  
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
  
  const outputPath = await saveImage(images[0], './generated-assets', 'ralph-cyberpunk-droid', 0);
  console.log(`💾 Saved to: ${outputPath}`);
  
  console.log('\n🎉 Done! Your cyberpunk character is ready.');
}

generateRalphDroid().catch(console.error);
