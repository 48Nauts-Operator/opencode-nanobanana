import { GeminiProvider } from './src/providers/gemini.js';
import { saveImage } from './src/utils/file-handler.js';
import { IOS_ICON_SIZES } from './src/platforms/ios.js';
import * as fs from 'fs/promises';
import sharp from 'sharp';

async function generateAppIcons() {
  console.log('🚀 Generating iOS App Icon Set - Blue Rocket Ship\n');
  
  const provider = new GeminiProvider();
  const outputDir = './generated-assets/ios-rocket-icons';
  
  // Create output directory
  await fs.mkdir(outputDir, { recursive: true });
  
  const prompt = 'A sleek blue rocket ship icon on a beautiful gradient background, purple to blue gradient, minimalist flat design, app icon style, centered composition, clean and modern';
  
  console.log('📝 Prompt:', prompt);
  console.log('⏳ Generating master icon (1024x1024)...\n');
  
  const startTime = Date.now();
  const images = await provider.generateImage(prompt, { 
    aspectRatio: '1:1', 
    count: 1 
  });
  
  const masterPath = `${outputDir}/icon-1024.png`;
  await fs.writeFile(masterPath, images[0]);
  console.log(`✅ Master icon saved: ${masterPath}`);
  
  console.log('\n📱 Generating all iOS sizes...\n');
  
  // Generate all iOS icon sizes
  for (const iconSize of IOS_ICON_SIZES) {
    const size = iconSize.size;
    const scale = iconSize.scale;
    const pixelSize = size * scale;
    const filename = `icon-${size}@${scale}x.png`;
    const filepath = `${outputDir}/${filename}`;
    
    await sharp(images[0])
      .resize(pixelSize, pixelSize, { fit: 'fill' })
      .png()
      .toFile(filepath);
    
    console.log(`   ✅ ${filename} (${pixelSize}x${pixelSize}px) - ${iconSize.idiom}`);
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log(`\n🎉 Done! Generated ${IOS_ICON_SIZES.length + 1} icons in ${duration}s`);
  console.log(`📁 Location: ${outputDir}`);
}

generateAppIcons().catch(console.error);
