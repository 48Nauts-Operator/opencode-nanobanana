import { GoogleGenAI } from '@google/genai';
import { createWriteStream } from 'fs';
import { Readable } from 'stream';
import * as fs from 'fs/promises';

async function generateVideo() {
  console.log('🎬 Generating Video - Ralph Ultra Hacking Scene...\n');
  
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const prompt = `A cartoon character with a round face wearing a futuristic cyberpunk suit with neon purple and orange glowing circuits approaches a computer terminal. The character sits down and starts typing rapidly, holographic displays appear showing code. Green matrix-style code reflections on face. Dramatic neon lighting, high-tech lab environment. Cyberpunk aesthetic, smooth animation.`;

  console.log('📝 Scene: Ralph Ultra approaching computer and hacking');
  console.log('🎨 Style: Cyberpunk, neon glows, holographic displays');
  console.log('\n⏳ Starting video generation (this takes 1-3 minutes)...\n');
  
  const startTime = Date.now();
  
  try {
    // Start video generation operation
    let operation = await ai.models.generateVideos({
      model: 'veo-2.0-generate-001',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        aspectRatio: '16:9',
      }
    });

    console.log('🔄 Operation started:', operation.name);
    
    // Poll for completion
    let pollCount = 0;
    while (!operation.done) {
      pollCount++;
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      console.log(`⏳ Generating... (${elapsed}s elapsed, poll #${pollCount})`);
      
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10s
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✅ Generation complete in ${duration}s`);

    // Download results
    if (operation.response?.generatedVideos && operation.response.generatedVideos.length > 0) {
      const video = operation.response.generatedVideos[0];
      const videoUrl = `${video.video?.uri}&key=${process.env.GEMINI_API_KEY}`;
      
      console.log('📥 Downloading video...');
      
      await fs.mkdir('./generated-assets', { recursive: true });
      const outputPath = './generated-assets/ralph-ultra-hacking.mp4';
      
      const resp = await fetch(videoUrl);
      const writer = createWriteStream(outputPath);
      Readable.fromWeb(resp.body as any).pipe(writer);
      
      await new Promise(resolve => writer.on('finish', resolve));
      
      console.log(`💾 Saved to: ${outputPath}`);
      console.log('\n🎉 Done! Your video is ready.');
    } else {
      console.log('❌ No videos were generated');
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message || error);
  }
}

generateVideo().catch(console.error);
