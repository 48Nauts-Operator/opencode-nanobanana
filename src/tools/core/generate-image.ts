/**
 * Generate Image Tool
 *
 * Creates images from text prompts using Google Gemini's Imagen model.
 * Supports batch generation, aspect ratio control, and custom output paths.
 */

import { tool, type ToolDefinition } from '@opencode-ai/plugin/tool';
import { GeminiProvider } from '../../providers/gemini.js';
import { saveImage, getOutputDir } from '../../utils/file-handler.js';

/**
 * Tool args schema
 */
const generateImageArgs = {
  prompt: tool.schema.string().describe('Text description of the image to generate'),
  aspectRatio: tool.schema.string()
    .optional()
    .describe('Aspect ratio for the image (e.g., "1:1", "16:9", "9:16"). Defaults to "1:1"'),
  outputPath: tool.schema.string()
    .optional()
    .describe('Custom output directory path. Defaults to "./generated-assets"'),
  count: tool.schema.number()
    .int()
    .min(1)
    .max(8)
    .optional()
    .describe('Number of images to generate (1-8). Defaults to 1')
} as const;

/**
 * Tool definition for generate_image
 */
export const generateImageTool: ToolDefinition = tool({
  description: 'Generate images from text prompts using Gemini Imagen. Supports batch generation (1-8 images), aspect ratio control, and custom output paths.',

  args: generateImageArgs,

  async execute(args, _context) {
    try {
      // Initialize Gemini provider
      const provider = new GeminiProvider();

      // Extract parameters with defaults
      const {
        prompt,
        aspectRatio = '1:1',
        count = 1,
        outputPath
      } = args;

      // Determine output directory
      const outputDir = outputPath || getOutputDir();

      // Generate images using Gemini
      const imageBuffers = await provider.generateImage(prompt, {
        aspectRatio,
        count
      });

      // Save all generated images
      const savedPaths: string[] = [];

      for (let i = 0; i < imageBuffers.length; i++) {
        const buffer = imageBuffers[i];
        if (!buffer) {
          throw new Error(`Failed to generate image ${i + 1}`);
        }
        const filepath = await saveImage(buffer, outputDir, prompt, i);
        savedPaths.push(filepath);
      }

      // Build success message
      const imageWord = count === 1 ? 'image' : 'images';
      const pathList = savedPaths.map((p, i) => `  ${i + 1}. ${p}`).join('\n');

      return [
        `✓ Successfully generated ${count} ${imageWord} from prompt: "${prompt}"`,
        ``,
        `Saved to:`,
        pathList,
        ``,
        `Aspect ratio: ${aspectRatio}`,
        `Output directory: ${outputDir}`
      ].join('\n');

    } catch (error) {
      // Handle errors with user-friendly messages
      if (error instanceof Error) {
        if (error.message.includes('GEMINI_API_KEY')) {
          return [
            '✗ Error: Gemini API key not found',
            '',
            'Please set your GEMINI_API_KEY environment variable.',
            'Get your API key at: https://makersuite.google.com/app/apikey'
          ].join('\n');
        }

        if (error.message.includes('Count must be between')) {
          return `✗ Error: ${error.message}`;
        }

        return [
          '✗ Image generation failed',
          '',
          `Error: ${error.message}`,
          '',
          'Please check your prompt and try again.'
        ].join('\n');
      }

      return '✗ Image generation failed with an unknown error';
    }
  }
});
