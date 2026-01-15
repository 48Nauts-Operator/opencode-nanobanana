import { GoogleGenAI } from '@google/genai';
import { createWriteStream } from 'fs';
import { Readable } from 'stream';
import * as fs from 'fs/promises';

async function generateProductAd() {
  console.log('🎬 Generating Product Advertisement Video...\n');
  
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const prompt = `Professional product advertisement video: An attractive woman in her 30s with long blonde-brown hair, wearing a grey tweed blazer over a white collared blouse, standing in a modern bright kitchen. She is holding a white cylindrical sports nutrition container with a grey lid, presenting it to the camera with a warm confident smile. She gestures towards the product while talking, professional lighting, clean modern kitchen with marble countertops in background, advertisement commercial style, high production value, 4K quality`;

  console.log('📝 Prompt:', prompt);
  console.log('\n⏳ Starting video generation (30-90 seconds)...\n');
  
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
    const outputPath = './generated-assets/sponser-product-ad.mp4';
    
    const resp = await fetch(videoUrl);
    const writer = createWriteStream(outputPath);
    Readable.fromWeb(resp.body as any).pipe(writer);
    
    await new Promise(resolve => writer.on('finish', resolve));
    
    console.log(`💾 Saved to: ${outputPath}`);
    console.log('\n🎉 Done! Product ad video ready (no audio).');
    console.log('\n⚠️  Note: Product is generic (not exact Sponser branding)');
    console.log('⚠️  Note: Person is AI-generated (similar style, not the actual person)');
  } else {
    console.log('❌ No videos were generated');
  }
}

generateProductAd().catch(console.error);
