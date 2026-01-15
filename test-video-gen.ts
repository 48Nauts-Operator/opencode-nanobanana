import { GeminiProvider } from './src/providers/gemini.js';
import * as fs from 'fs/promises';

async function generateVideo() {
  console.log('🎬 Generating Video - Ralph Ultra Hacking Scene...\n');
  
  const provider = new GeminiProvider();
  
  const prompt = `A cartoon character resembling a chubby kid with a round face and buck teeth, wearing a futuristic cyberpunk droid suit with neon purple and orange glowing circuits, approaches a computer terminal. The character sits down and starts typing rapidly on the keyboard, holographic displays appear showing code and system interfaces. Green matrix-style code reflections on the character's face. The scene has dramatic lighting with neon glows and a high-tech lab environment. Cinematic cyberpunk aesthetic, smooth animation.`;

  console.log('📝 Scene: Ralph Ultra approaching computer and hacking');
  console.log('🎨 Style: Cyberpunk, neon glows, holographic displays');
  console.log('\n⏳ Generating video (this may take a while)...\n');
  
  const startTime = Date.now();
  
  try {
    const videoBuffer = await provider.generateVideo(prompt, {
      duration: 5,
      aspectRatio: '16:9'
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log(`✅ Generated in ${duration}s`);
    console.log(`📦 Size: ${(videoBuffer.length / 1024 / 1024).toFixed(2)}MB\n`);
    
    const outputPath = './generated-assets/ralph-ultra-hacking.mp4';
    await fs.mkdir('./generated-assets', { recursive: true });
    await fs.writeFile(outputPath, videoBuffer);
    
    console.log(`💾 Saved to: ${outputPath}`);
    console.log('\n🎉 Done! Your video is ready.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

generateVideo().catch(console.error);
