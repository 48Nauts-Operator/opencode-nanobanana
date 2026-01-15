import { GeminiProvider } from './src/providers/gemini.js';
import { saveImage } from './src/utils/file-handler.js';

async function generateSocialPreview() {
  console.log('🌐 Generating Social Preview for Ralph Ultra...\n');
  
  const provider = new GeminiProvider();
  
  const projectName = "Ralph Ultra";
  const description = "Production-grade autonomous AI agent orchestration with health monitoring, cost tracking, and auto-recovery";
  const style = "bold";
  
  const prompt = `Create a professional social media preview image (Open Graph) for a project called "${projectName}" with the description: "${description}".

Use a high-contrast design with vibrant colors.
Dark background (navy blue, deep purple, or black) with bright accent colors.
Display the project name "Ralph Ultra" in extra-bold, large white or yellow text.
Show the description in bright white text below.
Add dramatic lighting effects, glows, or neon-style elements.
Create a strong visual impact - this should grab attention immediately.
Bold, modern, energetic design.

Requirements:
- Image must be in landscape orientation (wider than tall) at approximately 1200x630 pixels ratio
- Text must be large and highly readable even at small sizes
- Composition should be centered and balanced
- Professional quality suitable for social media sharing (Facebook, Twitter, LinkedIn)
- Design should work well as a thumbnail preview`;

  console.log(`📝 Project: ${projectName}`);
  console.log(`📄 Description: ${description}`);
  console.log(`🎨 Style: ${style}`);
  console.log('\n⏳ Generating...\n');
  
  const startTime = Date.now();
  const images = await provider.generateImage(prompt, { 
    aspectRatio: '16:9',
    count: 1 
  });
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log(`✅ Generated in ${duration}s`);
  console.log(`📦 Size: ${(images[0].length / 1024).toFixed(1)}KB\n`);
  
  const outputPath = await saveImage(images[0], './generated-assets', 'ralph-ultra-social-preview', 0);
  console.log(`💾 Saved to: ${outputPath}`);
  
  console.log(`
📝 Add this to your HTML <head>:
\`\`\`html
<meta property="og:image" content="${outputPath}" />
<meta property="og:title" content="${projectName}" />
<meta property="og:description" content="${description}" />
<meta name="twitter:card" content="summary_large_image" />
\`\`\`
`);

  console.log('🎉 Done! Your social preview is ready for sharing.');
}

generateSocialPreview().catch(console.error);
