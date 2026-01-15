/**
 * Restore Image Tool
 *
 * Enhances or repairs damaged images using Google Gemini's vision and generation capabilities.
 * Loads a source image, applies restoration/enhancement, and saves the result.
 */

import { tool, type ToolDefinition } from '@opencode-ai/plugin/tool';
import { GeminiProvider } from '../../providers/gemini.js';
import { loadImage, saveImage, getOutputDir } from '../../utils/file-handler.js';
import path from 'path';

/**
 * Tool args schema
 */
const restoreImageArgs = {
  imagePath: tool.schema.string().describe('Path to the source image file to restore'),
  instructions: tool.schema.string()
    .optional()
    .describe('Optional custom restoration instructions. Defaults to "restore and enhance this image"'),
  outputPath: tool.schema.string()
    .optional()
    .describe('Custom output directory path. Defaults to "./generated-assets"')
} as const;

/**
 * Tool definition for restore_image
 */
export const restoreImageTool: ToolDefinition = tool({
  description: 'Restore and enhance an image to improve quality, remove damage, or repair artifacts. Uses Gemini vision AI to intelligently restore images and saves the result with a "_restored" suffix.',

  args: restoreImageArgs,

  async execute(args, _context) {
    try {
      // Initialize Gemini provider
      const provider = new GeminiProvider();

      // Extract parameters
      const {
        imagePath,
        instructions = 'restore and enhance this image',
        outputPath
      } = args;

      // Determine output directory
      const outputDir = outputPath || getOutputDir();

      // Load source image
      let sourceBuffer: Buffer;
      try {
        sourceBuffer = await loadImage(imagePath);
      } catch (loadError) {
        return [
          '✗ Failed to load source image',
          '',
          `Error: ${loadError instanceof Error ? loadError.message : 'Unknown error'}`,
          '',
          `Image path: ${imagePath}`,
          'Please check that the file exists and is accessible.'
        ].join('\n');
      }

      // Restore image using Gemini editImage method
      const restoredBuffer = await provider.editImage(sourceBuffer, instructions);

      // Generate output filename with '_restored' suffix
      const parsedPath = path.parse(imagePath);
      const baseFilename = parsedPath.name;
      const restoredPrompt = `${baseFilename}_restored`;

      // Save restored image
      const savedPath = await saveImage(restoredBuffer, outputDir, restoredPrompt, 0);

      // Build success message
      return [
        `✓ Successfully restored image`,
        ``,
        `Source: ${imagePath}`,
        `Restoration instruction: "${instructions}"`,
        ``,
        `Saved to: ${savedPath}`,
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

        if (error.message.includes('No edited image was returned')) {
          return [
            '✗ Image restoration failed',
            '',
            'Gemini did not return a restored image.',
            'This may happen if the image cannot be processed or the format is unsupported.',
            '',
            'Try using a different image format (PNG, JPEG) or check if the image is corrupted.'
          ].join('\n');
        }

        return [
          '✗ Image restoration failed',
          '',
          `Error: ${error.message}`,
          '',
          'Please check your image path and try again.'
        ].join('\n');
      }

      return '✗ Image restoration failed with an unknown error';
    }
  }
});
