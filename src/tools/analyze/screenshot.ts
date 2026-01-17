/**
 * Analyze Screenshot Tool
 *
 * Provides detailed visual analysis of UI screenshots for debugging purposes.
 * Identifies components, layout issues, accessibility concerns, and provides improvement suggestions.
 */

import { tool, type ToolDefinition } from '@opencode-ai/plugin/tool';
import { GeminiProvider } from '../../providers/gemini.js';
import { loadImage } from '../../utils/file-handler.js';

/**
 * Tool args schema
 */
const analyzeScreenshotArgs = {
  imagePath: tool.schema.string()
    .describe('Path to the screenshot image to analyze'),
  question: tool.schema.string()
    .optional()
    .describe('Specific question or focus area for the analysis. If not provided, performs comprehensive UI analysis')
} as const;

/**
 * Tool definition for analyze_screenshot
 */
export const analyzeScreenshotTool: ToolDefinition = tool({
  description: 'Analyze UI screenshots for debugging. Identifies components, layout issues, accessibility concerns, and provides improvement suggestions. Optionally accepts a specific question to focus the analysis.',

  args: analyzeScreenshotArgs,

  async execute(args, _context) {
    try {
      const { imagePath, question } = args;

      // Initialize Gemini provider
      const provider = new GeminiProvider();

      // Load the screenshot image
      const imageBuffer = await loadImage(imagePath);

      // Build analysis prompt
      const analysisPrompt = question ||
        'Analyze this UI screenshot in detail. Identify:\n' +
        '1. UI components and their purpose\n' +
        '2. Layout and spacing issues\n' +
        '3. Accessibility concerns (contrast, text size, touch targets)\n' +
        '4. Visual inconsistencies or bugs\n' +
        '5. Suggestions for improvement\n\n' +
        'Provide a clear, structured analysis.';

      // Analyze the screenshot using Gemini
      const analysis = await provider.analyzeImage(imageBuffer, analysisPrompt);

      return `✓ Screenshot Analysis Complete

Path: ${imagePath}

${analysis}`;

    } catch (error) {
      if (error instanceof Error && error.message.includes('GEMINI_API_KEY')) {
        return '✗ Error: GEMINI_API_KEY is not set. Please configure your API key in environment variables.';
      }
      if (error instanceof Error && (error.message.includes('ENOENT') || error.message.includes('no such file'))) {
        return `✗ Error: Could not load screenshot at path: ${args.imagePath}. Please verify the file exists.`;
      }
      return `✗ Error analyzing screenshot: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
});
