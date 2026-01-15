import { GoogleGenAI } from '@google/genai';
import { createWriteStream } from 'fs';
import { Readable } from 'stream';
import * as fs from 'fs/promises';

async function generateVideo() {
  console.log('🎬 Generating Video - Zurich Bahnhofstrasse Scene...\n');
  
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const prompt = `Street scene of a well-dressed brunette woman walking along Bahnhofstrasse Zurich, boutique storefronts in background, golden hour lighting, professional cinematography`;

  console.log('📝 Prompt:', prompt);
  console.log('\n⏳ Starting video generation (this takes 30-90 seconds)...\n');
  
  const startTime = Date.now();
  
  let operation = await ai.models.generateVideos({
    model: 'veo-2.0-generate-001',
    prompt: prompt,
    config: {
      numberOfVideos: 1,
      aspectRatio: '16:9',
    }
  });

  console.log('🔄 Operation started:', operation.name);
  
  let pollCount = 0;
  while (!operation.done) {
    pollCount++;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    console.log(`⏳ Generating... (${elapsed}s elapsed, poll #${pollCount})`);
    
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation });
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✅ Generation complete in ${duration}s`);

  if (operation.response?.generatedVideos && operation.response.generatedVideos.length > 0) {
    const video = operation.response.generatedVideos[0];
    const videoUrl = `${video.video?.uri}&key=${process.env.GEMINI_API_KEY}`;
    
    console.log('📥 Downloading video...');
    
    await fs.mkdir('./generated-assets', { recursive: true });
    const outputPath = './generated-assets/zurich-bahnhofstrasse.mp4';
    
    const resp = await fetch(videoUrl);
    const writer = createWriteStream(outputPath);
    Readable.fromWeb(resp.body as any).pipe(writer);
    
    await new Promise(resolve => writer.on('finish', resolve));
    
    console.log(`💾 Saved to: ${outputPath}`);
    console.log('\n🎉 Done! Your video is ready (note: no audio).');
  } else {
    console.log('❌ No videos were generated');
  }
}

generateVideo().catch(console.error);
