import { tool } from '@opencode-ai/plugin/tool';
import type { Plugin } from '@opencode-ai/plugin';
import { GeminiProvider } from './providers/gemini.js';
import { generateVideo } from './tools/video/generate-video.js';
import { imageToVideo } from './tools/video/image-to-video.js';
import { generateStoryboardVideo } from './tools/video/storyboard-video.js';
import { extendVideo } from './tools/video/extend-video.js';
import { loadImage, saveImage, getOutputDir } from './utils/file-handler.js';
import { writeFile } from 'fs/promises';
import { join, parse as parsePath } from 'path';
import { tmpdir } from 'os';

function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY environment variable is required. ' +
        'Get one at https://aistudio.google.com/app/apikey'
    );
  }
  return apiKey;
}

const plugin: Plugin = async (_input) => {
  return {
    tool: {
      generate_image: tool({
        description:
          'Generate an image from a text prompt using Google Imagen 3 (Nano Banana - FREE). ' +
          'Creates high-quality images for icons, illustrations, photos, art, and more. ' +
          'Supports aspect ratios: 1:1 (square), 3:4, 4:3, 9:16 (portrait), 16:9 (landscape).',
        args: {
          prompt: tool.schema.string().describe(
            'Description of the image to generate. Be specific about style, colors, composition, lighting.'
          ),
          aspectRatio: tool.schema
            .enum(['1:1', '3:4', '4:3', '9:16', '16:9'])
            .optional()
            .describe('Aspect ratio for the image. Defaults to 1:1 (square)'),
          outputPath: tool.schema
            .string()
            .optional()
            .describe('Path where the image should be saved. If not provided, saves to temp directory'),
        },
        async execute(args, _context) {
          try {
            const apiKey = getApiKey();
            const provider = new GeminiProvider(apiKey);
            const result = await provider.generateImageSingle(args.prompt, {
              aspectRatio: args.aspectRatio as '1:1' | '3:4' | '4:3' | '9:16' | '16:9' | undefined,
            });
            const outputPath = args.outputPath || join(tmpdir(), `image-${Date.now()}.png`);
            await writeFile(outputPath, result.buffer);
            return JSON.stringify({
              success: true,
              imagePath: outputPath,
              mimeType: result.mimeType,
              generationTime: `${(result.generationTime / 1000).toFixed(1)}s`,
            });
          } catch (error: unknown) {
            const err = error as Error;
            return JSON.stringify({
              success: false,
              error: err?.message || String(error),
              help: 'Check your GEMINI_API_KEY environment variable.',
            });
          }
        },
      }),

      edit_image: tool({
        description:
          'Edit an existing image using natural language instructions. ' +
          'Loads a source image, applies edits via Gemini AI, and saves the result.',
        args: {
          imagePath: tool.schema.string().describe('Path to the source image file to edit'),
          editPrompt: tool.schema.string().describe('Natural language instructions for how to edit the image'),
          outputPath: tool.schema.string().optional().describe('Custom output directory path'),
        },
        async execute(args, _context) {
          try {
            const provider = new GeminiProvider(getApiKey());
            const sourceBuffer = await loadImage(args.imagePath);
            const editedBuffer = await provider.editImage(sourceBuffer, args.editPrompt);
            const outputDir = args.outputPath || getOutputDir();
            const parsed = parsePath(args.imagePath);
            const savedPath = await saveImage(editedBuffer, outputDir, `${parsed.name}_edited`, 0);
            return JSON.stringify({
              success: true,
              imagePath: savedPath,
              source: args.imagePath,
            });
          } catch (error: unknown) {
            return JSON.stringify({ success: false, error: (error as Error)?.message || String(error) });
          }
        },
      }),

      restore_image: tool({
        description:
          'Restore and enhance an image to improve quality, remove damage, or repair artifacts.',
        args: {
          imagePath: tool.schema.string().describe('Path to the source image file to restore'),
          instructions: tool.schema.string().optional().describe('Custom restoration instructions'),
          outputPath: tool.schema.string().optional().describe('Custom output directory path'),
        },
        async execute(args, _context) {
          try {
            const provider = new GeminiProvider(getApiKey());
            const sourceBuffer = await loadImage(args.imagePath);
            const instructions = args.instructions || 'restore and enhance this image';
            const restoredBuffer = await provider.editImage(sourceBuffer, instructions);
            const outputDir = args.outputPath || getOutputDir();
            const parsed = parsePath(args.imagePath);
            const savedPath = await saveImage(restoredBuffer, outputDir, `${parsed.name}_restored`, 0);
            return JSON.stringify({
              success: true,
              imagePath: savedPath,
              source: args.imagePath,
            });
          } catch (error: unknown) {
            return JSON.stringify({ success: false, error: (error as Error)?.message || String(error) });
          }
        },
      }),

      analyze_screenshot: tool({
        description:
          'Analyze UI screenshots for debugging. Identifies components, layout issues, ' +
          'accessibility concerns, and provides improvement suggestions.',
        args: {
          imagePath: tool.schema.string().describe('Path to the screenshot image to analyze'),
          question: tool.schema.string().optional().describe('Specific question or focus area for the analysis'),
        },
        async execute(args, _context) {
          try {
            const provider = new GeminiProvider(getApiKey());
            const imageBuffer = await loadImage(args.imagePath);
            const prompt = args.question ||
              'Analyze this UI screenshot. Identify: 1. UI components 2. Layout issues 3. Accessibility concerns 4. Visual bugs 5. Improvement suggestions';
            const analysis = await provider.analyzeImage(imageBuffer, prompt);
            return JSON.stringify({ success: true, analysis, imagePath: args.imagePath });
          } catch (error: unknown) {
            return JSON.stringify({ success: false, error: (error as Error)?.message || String(error) });
          }
        },
      }),

      compare_screenshots: tool({
        description:
          'Compare two screenshots to detect visual differences. ' +
          'Useful for visual regression testing.',
        args: {
          imagePath1: tool.schema.string().describe('Path to the first screenshot (baseline)'),
          imagePath2: tool.schema.string().describe('Path to the second screenshot (comparison)'),
        },
        async execute(args, _context) {
          try {
            const provider = new GeminiProvider(getApiKey());
            const image1 = await loadImage(args.imagePath1);
            const image2 = await loadImage(args.imagePath2);
            const prompt =
              'Compare these two screenshots. Identify: 1. Visual differences 2. Component changes 3. Spacing differences 4. Typography changes';
            const analysis = await provider.analyzeMultipleImages([image1, image2], prompt);
            return JSON.stringify({ success: true, analysis, image1: args.imagePath1, image2: args.imagePath2 });
          } catch (error: unknown) {
            return JSON.stringify({ success: false, error: (error as Error)?.message || String(error) });
          }
        },
      }),

      analyze_mockup: tool({
        description:
          'Extract design specifications from mockup images. ' +
          'Identifies colors, typography, spacing, component structure.',
        args: {
          imagePath: tool.schema.string().describe('Path to the design mockup image'),
          extractColors: tool.schema.boolean().optional().describe('Extract color palette (default: true)'),
          extractSpacing: tool.schema.boolean().optional().describe('Extract spacing measurements (default: true)'),
        },
        async execute(args, _context) {
          try {
            const provider = new GeminiProvider(getApiKey());
            const imageBuffer = await loadImage(args.imagePath);
            const prompt =
              'Analyze this design mockup. Extract: Component Structure, Typography, ' +
              (args.extractColors !== false ? 'Color Palette (hex codes), ' : '') +
              (args.extractSpacing !== false ? 'Spacing & Layout measurements, ' : '') +
              'Design System Notes';
            const analysis = await provider.analyzeImage(imageBuffer, prompt);
            return JSON.stringify({ success: true, analysis, imagePath: args.imagePath });
          } catch (error: unknown) {
            return JSON.stringify({ success: false, error: (error as Error)?.message || String(error) });
          }
        },
      }),

      mockup_to_code: tool({
        description:
          'Convert design mockup images to component code. ' +
          'Supports React, Vue, SwiftUI, and HTML with various styling options.',
        args: {
          imagePath: tool.schema.string().describe('Path to the design mockup image'),
          framework: tool.schema.enum(['react', 'vue', 'swiftui', 'html']).describe('Target framework'),
          styling: tool.schema.enum(['tailwind', 'css', 'styled-components']).optional().describe('Styling approach'),
          componentName: tool.schema.string().optional().describe('Name for the generated component'),
        },
        async execute(args, _context) {
          try {
            const provider = new GeminiProvider(getApiKey());
            const imageBuffer = await loadImage(args.imagePath);
            const name = args.componentName || 'DesignComponent';
            const prompt = `Analyze this design mockup and generate ${args.framework} code with ${args.styling || 'tailwind'} styling. Component name: ${name}. Focus on accurate layout, colors, typography, and accessibility.`;
            const code = await provider.analyzeImage(imageBuffer, prompt);
            return JSON.stringify({ success: true, code, framework: args.framework, componentName: name });
          } catch (error: unknown) {
            return JSON.stringify({ success: false, error: (error as Error)?.message || String(error) });
          }
        },
      }),

      sketch_to_code: tool({
        description:
          'Convert hand-drawn sketches and wireframes to component code. ' +
          'Interprets rough designs and generates production-ready code.',
        args: {
          imagePath: tool.schema.string().describe('Path to the sketch or wireframe image'),
          framework: tool.schema.enum(['react', 'vue', 'swiftui', 'html']).describe('Target framework'),
          styling: tool.schema.enum(['tailwind', 'css', 'styled-components']).optional().describe('Styling approach'),
          componentName: tool.schema.string().optional().describe('Name for the generated component'),
        },
        async execute(args, _context) {
          try {
            const provider = new GeminiProvider(getApiKey());
            const imageBuffer = await loadImage(args.imagePath);
            const name = args.componentName || 'SketchComponent';
            const prompt = `This is a hand-drawn sketch/wireframe. Interpret the intent and generate ${args.framework} code with ${args.styling || 'tailwind'} styling. Component name: ${name}. Convert rough shapes to proper UI components.`;
            const code = await provider.analyzeImage(imageBuffer, prompt);
            return JSON.stringify({ success: true, code, framework: args.framework, componentName: name });
          } catch (error: unknown) {
            return JSON.stringify({ success: false, error: (error as Error)?.message || String(error) });
          }
        },
      }),

      generate_architecture_diagram: tool({
        description:
          'Generate architecture diagrams from text descriptions. ' +
          'Supports styles: boxes, cloud, technical. Formats: PNG or Mermaid.',
        args: {
          description: tool.schema.string().describe('Description of the architecture'),
          style: tool.schema.enum(['boxes', 'cloud', 'technical']).optional().describe('Visual style (default: technical)'),
          format: tool.schema.enum(['png', 'mermaid']).optional().describe('Output format (default: png)'),
          outputPath: tool.schema.string().optional().describe('Custom output path'),
        },
        async execute(args, _context) {
          try {
            if (args.format === 'mermaid') {
              const mermaid = `\`\`\`mermaid\ngraph TB\n  A[Component A] --> B[Component B]\n  B --> C[Component C]\n%% Customize based on: ${args.description}\n\`\`\``;
              return JSON.stringify({ success: true, mermaid, format: 'mermaid' });
            }
            const provider = new GeminiProvider(getApiKey());
            const style = args.style || 'technical';
            const prompt = `Create a professional ${style} architecture diagram: ${args.description}`;
            const images = await provider.generateImage(prompt, { aspectRatio: '16:9', count: 1 });
            if (!images[0]) throw new Error('Failed to generate diagram');
            const outputDir = args.outputPath || getOutputDir();
            const savedPath = await saveImage(images[0], outputDir, 'architecture-diagram', 0);
            return JSON.stringify({ success: true, imagePath: savedPath, style });
          } catch (error: unknown) {
            return JSON.stringify({ success: false, error: (error as Error)?.message || String(error) });
          }
        },
      }),

      generate_sequence_diagram: tool({
        description:
          'Generate sequence diagrams showing interaction flows. ' +
          'Supports PNG (visual) or Mermaid (text-based) formats.',
        args: {
          description: tool.schema.string().describe('Description of the sequence/interaction flow'),
          format: tool.schema.enum(['png', 'mermaid']).optional().describe('Output format (default: png)'),
          outputPath: tool.schema.string().optional().describe('Custom output path'),
        },
        async execute(args, _context) {
          try {
            if (args.format === 'mermaid') {
              const mermaid = `\`\`\`mermaid\nsequenceDiagram\n  participant User\n  participant System\n  User->>System: Request\n  System-->>User: Response\n%% Customize based on: ${args.description}\n\`\`\``;
              return JSON.stringify({ success: true, mermaid, format: 'mermaid' });
            }
            const provider = new GeminiProvider(getApiKey());
            const prompt = `Create a professional sequence diagram showing: ${args.description}`;
            const images = await provider.generateImage(prompt, { aspectRatio: '16:9', count: 1 });
            if (!images[0]) throw new Error('Failed to generate diagram');
            const outputDir = args.outputPath || getOutputDir();
            const savedPath = await saveImage(images[0], outputDir, 'sequence-diagram', 0);
            return JSON.stringify({ success: true, imagePath: savedPath });
          } catch (error: unknown) {
            return JSON.stringify({ success: false, error: (error as Error)?.message || String(error) });
          }
        },
      }),

      generate_readme_banner: tool({
        description:
          'Generate a professional README banner image for your project. ' +
          'Styles: gradient, minimal, tech. Optimized for GitHub (1280x640).',
        args: {
          projectName: tool.schema.string().describe('The name of the project'),
          tagline: tool.schema.string().optional().describe('Optional tagline or description'),
          style: tool.schema.enum(['gradient', 'minimal', 'tech']).optional().describe('Visual style (default: gradient)'),
          outputPath: tool.schema.string().optional().describe('Custom output path'),
        },
        async execute(args, _context) {
          try {
            const provider = new GeminiProvider(getApiKey());
            const style = args.style || 'gradient';
            const prompt = `Create a ${style} README banner for "${args.projectName}"${args.tagline ? ` with tagline: "${args.tagline}"` : ''}. Wide format, bold text, professional.`;
            const images = await provider.generateImage(prompt, { aspectRatio: '16:9', count: 1 });
            if (!images[0]) throw new Error('Failed to generate banner');
            const outputDir = args.outputPath || getOutputDir();
            const filename = `${args.projectName.toLowerCase().replace(/\s+/g, '-')}-banner`;
            const savedPath = await saveImage(images[0], outputDir, filename, 0);
            return JSON.stringify({ success: true, imagePath: savedPath, style, projectName: args.projectName });
          } catch (error: unknown) {
            return JSON.stringify({ success: false, error: (error as Error)?.message || String(error) });
          }
        },
      }),

      generate_social_preview: tool({
        description:
          'Generate a social media preview (Open Graph) image for project sharing. ' +
          'Creates 1200x630 images for Facebook, Twitter, LinkedIn.',
        args: {
          projectName: tool.schema.string().describe('The name of the project'),
          description: tool.schema.string().optional().describe('Brief description or tagline'),
          style: tool.schema.enum(['gradient', 'minimal', 'bold']).optional().describe('Visual style (default: gradient)'),
          outputPath: tool.schema.string().optional().describe('Custom output path'),
        },
        async execute(args, _context) {
          try {
            const provider = new GeminiProvider(getApiKey());
            const style = args.style || 'gradient';
            const prompt = `Create a ${style} social media preview for "${args.projectName}"${args.description ? `: ${args.description}` : ''}. 1200x630 format, eye-catching, professional.`;
            const images = await provider.generateImage(prompt, { aspectRatio: '16:9', count: 1 });
            if (!images[0]) throw new Error('Failed to generate preview');
            const outputDir = args.outputPath || getOutputDir();
            const filename = `${args.projectName.toLowerCase().replace(/\s+/g, '-')}-social-preview`;
            const savedPath = await saveImage(images[0], outputDir, filename, 0);
            return JSON.stringify({ success: true, imagePath: savedPath, style });
          } catch (error: unknown) {
            return JSON.stringify({ success: false, error: (error as Error)?.message || String(error) });
          }
        },
      }),

      generate_video: tool({
        description:
          'Generate a video from a text prompt using Google Veo 3. ' +
          'Creates high-quality video with native audio. Duration: 4, 6, or 8 seconds.',
        args: {
          prompt: tool.schema.string().describe('Description of the video to generate'),
          aspectRatio: tool.schema.enum(['16:9', '9:16']).optional().describe('Aspect ratio (default: 16:9)'),
          resolution: tool.schema.enum(['720p', '1080p']).optional().describe('Resolution (default: 720p)'),
          duration: tool.schema.enum(['4', '6', '8']).optional().describe('Duration in seconds (default: 8)'),
          outputPath: tool.schema.string().optional().describe('Path where the video should be saved'),
        },
        async execute(args, _context) {
          try {
            const result = await generateVideo({
              apiKey: getApiKey(),
              prompt: args.prompt,
              aspectRatio: args.aspectRatio as '16:9' | '9:16' | undefined,
              resolution: args.resolution as '720p' | '1080p' | undefined,
              duration: args.duration ? (parseInt(args.duration, 10) as 4 | 6 | 8) : undefined,
              outputPath: args.outputPath,
            });
            return JSON.stringify({
              success: true,
              videoPath: result.videoPath,
              generationTime: `${(result.generationTime / 1000).toFixed(1)}s`,
            });
          } catch (error: unknown) {
            return JSON.stringify({ success: false, error: (error as Error)?.message || String(error) });
          }
        },
      }),

      image_to_video: tool({
        description:
          'Animate a static image into a video using Google Veo 3. ' +
          'Brings images to life with motion and audio.',
        args: {
          imagePath: tool.schema.string().describe('Path to the image file to animate'),
          prompt: tool.schema.string().describe('Description of the animation'),
          aspectRatio: tool.schema.enum(['16:9', '9:16']).optional().describe('Aspect ratio (default: 16:9)'),
          resolution: tool.schema.enum(['720p', '1080p']).optional().describe('Resolution (default: 720p)'),
          duration: tool.schema.enum(['4', '6', '8']).optional().describe('Duration in seconds (default: 8)'),
          outputPath: tool.schema.string().optional().describe('Path where the video should be saved'),
        },
        async execute(args, _context) {
          try {
            const result = await imageToVideo({
              apiKey: getApiKey(),
              imagePath: args.imagePath,
              prompt: args.prompt,
              aspectRatio: args.aspectRatio as '16:9' | '9:16' | undefined,
              resolution: args.resolution as '720p' | '1080p' | undefined,
              duration: args.duration ? (parseInt(args.duration, 10) as 4 | 6 | 8) : undefined,
              outputPath: args.outputPath,
            });
            return JSON.stringify({
              success: true,
              videoPath: result.videoPath,
              generationTime: `${(result.generationTime / 1000).toFixed(1)}s`,
            });
          } catch (error: unknown) {
            return JSON.stringify({ success: false, error: (error as Error)?.message || String(error) });
          }
        },
      }),

      generate_storyboard_video: tool({
        description:
          'Generate a multi-scene storyboard video. Creates scenes and stitches them with transitions. ' +
          'Supports character consistency. Requires FFmpeg.',
        args: {
          scenes: tool.schema.array(tool.schema.string()).describe('Array of scene descriptions'),
          style: tool.schema.string().optional().describe('Visual style for all scenes'),
          characterDescription: tool.schema.string().optional().describe('Main character description for consistency'),
          referenceImages: tool.schema.array(tool.schema.string()).optional().describe('Paths to reference images (max 3)'),
          aspectRatio: tool.schema.enum(['16:9', '9:16']).optional().describe('Aspect ratio (default: 16:9)'),
          transition: tool.schema.enum(['cut', 'crossfade', 'fade']).optional().describe('Transition type (default: crossfade)'),
          transitionDuration: tool.schema.number().optional().describe('Transition duration in seconds (default: 0.5)'),
          backgroundMusic: tool.schema.string().optional().describe('Path to background music audio file'),
          musicVolume: tool.schema.number().optional().describe('Background music volume 0.0-1.0 (default: 0.3)'),
          outputPath: tool.schema.string().optional().describe('Path where the final video should be saved'),
        },
        async execute(args, _context) {
          try {
            const result = await generateStoryboardVideo({
              apiKey: getApiKey(),
              scenes: args.scenes,
              style: args.style,
              characterDescription: args.characterDescription,
              referenceImages: args.referenceImages,
              aspectRatio: args.aspectRatio as '16:9' | '9:16' | undefined,
              transition: args.transition as 'cut' | 'crossfade' | 'fade' | undefined,
              transitionDuration: args.transitionDuration,
              backgroundMusic: args.backgroundMusic,
              musicVolume: args.musicVolume,
              outputPath: args.outputPath,
            });
            return JSON.stringify({
              success: true,
              videoPath: result.videoPath,
              totalTime: `${(result.totalTime / 1000).toFixed(1)}s`,
              scenesGenerated: result.successCount,
              scenesFailed: result.failureCount,
            });
          } catch (error: unknown) {
            return JSON.stringify({ success: false, error: (error as Error)?.message || String(error) });
          }
        },
      }),

      extend_video: tool({
        description:
          'Extend an existing video with new AI-generated content using Veo 3. ' +
          'Seamlessly continues the video matching the original style.',
        args: {
          videoPath: tool.schema.string().describe('Path to the existing video to extend'),
          prompt: tool.schema.string().describe('Description of the extension'),
          aspectRatio: tool.schema.enum(['16:9', '9:16']).optional().describe('Aspect ratio (default: 16:9)'),
          resolution: tool.schema.enum(['720p', '1080p']).optional().describe('Resolution (default: 720p)'),
          outputPath: tool.schema.string().optional().describe('Path where the extended video should be saved'),
        },
        async execute(args, _context) {
          try {
            const result = await extendVideo({
              apiKey: getApiKey(),
              videoPath: args.videoPath,
              prompt: args.prompt,
              aspectRatio: args.aspectRatio as '16:9' | '9:16' | undefined,
              resolution: args.resolution as '720p' | '1080p' | undefined,
              outputPath: args.outputPath,
            });
            return JSON.stringify({
              success: true,
              videoPath: result.videoPath,
              generationTime: `${(result.generationTime / 1000).toFixed(1)}s`,
            });
          } catch (error: unknown) {
            return JSON.stringify({ success: false, error: (error as Error)?.message || String(error) });
          }
        },
      }),
    },
  };
};

export default plugin;
