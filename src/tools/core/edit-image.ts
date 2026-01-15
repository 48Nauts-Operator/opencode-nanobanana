/**
 * Edit Image Tool
 *
 * Modifies existing images using natural language instructions with Google Gemini's vision and generation capabilities.
 * Loads a source image, sends it with edit instructions to Gemini, and saves the result.
 */

import { tool, type ToolDefinition } from '@opencode-ai/plugin/tool';
import { GeminiProvider } from '../../providers/gemini.js';
import { loadImage, saveImage, getOutputDir } from '../../utils/file-handler.js';
import path from 'path';

/**
 * Tool args schema
 */
const editImageArgs = {
  imagePath: tool.schema.string().describe('Path to the source image file to edit'),
  editPrompt: tool.schema.string().describe('Natural language instructions for how to edit the image'),
  outputPath: tool.schema.string()
    .optional()
    .describe('Custom output directory path. Defaults to "./generated-assets"')
} as const;

/**
 * Tool definition for edit_image
 */
export const editImageTool: ToolDefinition = tool({
  description: 'Edit an existing image using natural language instructions. Loads a source image, applies edits via Gemini vision AI, and saves the result with an "_edited" suffix.',

  args: editImageArgs,

  async execute(args, _context) {
    try {
      // Initialize Gemini provider
      const provider = new GeminiProvider();

      // Extract parameters
      const {
        imagePath,
        editPrompt,
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

      // Edit image using Gemini
      const editedBuffer = await provider.editImage(sourceBuffer, editPrompt);

      // Generate output filename with '_edited' suffix
      const parsedPath = path.parse(imagePath);
      const baseFilename = parsedPath.name;
      const editedPrompt = `${baseFilename}_edited`;

      // Save edited image
      const savedPath = await saveImage(editedBuffer, outputDir, editedPrompt, 0);

      // Build success message
      return [
        `✓ Successfully edited image`,
        ``,
        `Source: ${imagePath}`,
        `Edit instruction: "${editPrompt}"`,
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
            '✗ Image editing failed',
            '',
            'Gemini did not return an edited image.',
            'This may happen if the edit prompt is unclear or not supported.',
            '',
            'Try rephrasing your edit instruction with more specific details.'
          ].join('\n');
        }

        return [
          '✗ Image editing failed',
          '',
          `Error: ${error.message}`,
          '',
          'Please check your image path and edit prompt, then try again.'
        ].join('\n');
      }

      return '✗ Image editing failed with an unknown error';
    }
  }
});
