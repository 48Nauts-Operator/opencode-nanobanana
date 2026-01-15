/**
 * Compare Screenshots Tool
 *
 * Compares two screenshots to detect visual differences.
 * Useful for visual regression testing and identifying UI changes.
 */

import { tool, type ToolDefinition } from '@opencode-ai/plugin/tool';
import { GeminiProvider } from '../../providers/gemini.js';
import { loadImage, saveImage, getOutputDir } from '../../utils/file-handler.js';

/**
 * Tool args schema
 */
const compareScreenshotsArgs = {
  imagePath1: tool.schema.string()
    .describe('Path to the first screenshot image (baseline/before)'),
  imagePath2: tool.schema.string()
    .describe('Path to the second screenshot image (comparison/after)'),
  highlightDifferences: tool.schema.boolean()
    .optional()
    .describe('If true, generate a visual diff image highlighting the differences. Default: false')
} as const;

/**
 * Tool definition for compare_screenshots
 */
export const compareScreenshotsTool: ToolDefinition = tool({
  description: 'Compare two screenshots to detect visual differences. Returns a detailed description of changes. Optionally generates a visual diff image highlighting the differences.',

  args: compareScreenshotsArgs,

  async execute(args, _context) {
    try {
      const { imagePath1, imagePath2, highlightDifferences = false } = args;

      // Initialize Gemini provider
      const provider = new GeminiProvider();

      // Load both screenshot images
      const image1Buffer = await loadImage(imagePath1);
      const image2Buffer = await loadImage(imagePath2);

      // Build comparison prompt
      const comparisonPrompt =
        'Compare these two screenshots in detail. Identify and describe:\n' +
        '1. Visual differences (layout, colors, text, images)\n' +
        '2. Component changes (added, removed, or modified elements)\n' +
        '3. Spacing and alignment differences\n' +
        '4. Typography changes (font size, weight, color)\n' +
        '5. Overall impact of the changes\n\n' +
        'Be specific about locations and changes. If the images are identical, clearly state that.';

      // Analyze the comparison using Gemini
      // Note: Gemini's multi-image analysis requires sending both images in a single request
      const analysis = await provider.analyzeMultipleImages(
        [image1Buffer, image2Buffer],
        comparisonPrompt
      );

      let resultMessage = `✓ Screenshot Comparison Complete

Image 1: ${imagePath1}
Image 2: ${imagePath2}

${analysis}`;

      // Generate diff highlight image if requested
      if (highlightDifferences) {
        try {
          // Create a prompt for Gemini to generate a visual diff
          const diffPrompt =
            'Create a visual difference image that highlights the changes between the two screenshots. ' +
            'Use red/pink highlighting to mark areas that have changed. ' +
            'Show both screenshots side by side with the differences clearly marked.';

          const diffBuffer = await provider.editImage(image1Buffer, diffPrompt);

          // Save the diff image
          const outputDir = getOutputDir();
          const diffPath = await saveImage(
            diffBuffer,
            outputDir,
            'screenshot-diff',
            0
          );

          resultMessage += `\n\n✓ Visual diff image generated: ${diffPath}`;
        } catch (diffError) {
          resultMessage += `\n\n⚠ Warning: Could not generate visual diff image: ${diffError instanceof Error ? diffError.message : String(diffError)}`;
        }
      }

      return resultMessage;

    } catch (error) {
      if (error instanceof Error && error.message.includes('GEMINI_API_KEY')) {
        return '✗ Error: GEMINI_API_KEY is not set. Please configure your API key in environment variables.';
      }
      if (error instanceof Error && (error.message.includes('ENOENT') || error.message.includes('no such file'))) {
        return `✗ Error: Could not load one or both screenshots. Please verify the file paths exist:\n  - ${args.imagePath1}\n  - ${args.imagePath2}`;
      }
      return `✗ Error comparing screenshots: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
});
