/**
 * Analyze Mockup Tool
 *
 * Extracts design specifications from mockup images including colors, typography,
 * spacing, and component structure. Useful for design-to-code workflows.
 */

import { tool, type ToolDefinition } from '@opencode-ai/plugin/tool';
import { GeminiProvider } from '../../providers/gemini.js';
import { loadImage } from '../../utils/file-handler.js';

/**
 * Tool args schema
 */
const analyzeMockupArgs = {
  imagePath: tool.schema.string()
    .describe('Path to the design mockup image to analyze'),
  extractColors: tool.schema.boolean()
    .optional()
    .default(true)
    .describe('Whether to extract color palette from the design (default: true)'),
  extractSpacing: tool.schema.boolean()
    .optional()
    .default(true)
    .describe('Whether to extract spacing and layout measurements (default: true)')
} as const;

/**
 * Build comprehensive design analysis prompt
 */
function buildDesignAnalysisPrompt(extractColors: boolean, extractSpacing: boolean): string {
  const sections: string[] = [
    'Analyze this design mockup and extract detailed design specifications.'
  ];

  // Always extract component structure and typography
  sections.push(
    '\n## Component Structure',
    '- Identify all UI components (buttons, inputs, cards, navigation, etc.)',
    '- Describe the visual hierarchy',
    '- Note component states (hover, active, disabled) if visible'
  );

  sections.push(
    '\n## Typography',
    '- Font families used (or similar web-safe alternatives)',
    '- Font sizes for headings, body text, captions',
    '- Font weights and styles',
    '- Line heights and letter spacing'
  );

  // Conditional: color extraction
  if (extractColors) {
    sections.push(
      '\n## Color Palette',
      '- Primary, secondary, and accent colors (provide hex codes)',
      '- Background and surface colors',
      '- Text colors (body, headings, muted)',
      '- Border and divider colors',
      '- Status colors (success, warning, error, info) if present'
    );
  }

  // Conditional: spacing and measurements
  if (extractSpacing) {
    sections.push(
      '\n## Spacing & Layout',
      '- Margin and padding values (estimate in px or rem)',
      '- Grid or layout system used',
      '- Border radius values',
      '- Shadow specifications',
      '- Component dimensions and aspect ratios'
    );
  }

  sections.push(
    '\n## Design System Notes',
    '- Overall design style (modern, minimal, material, iOS, etc.)',
    '- Notable design patterns or conventions',
    '- Responsive considerations if visible'
  );

  sections.push(
    '\nProvide specific, actionable values that a developer can use to implement this design.'
  );

  return sections.join('\n');
}

/**
 * Tool definition for analyze_mockup
 */
export const analyzeMockupTool: ToolDefinition = tool({
  description: 'Extract design specifications from mockup images. Identifies colors, typography, spacing, component structure, and design system details. Perfect for design-to-code workflows.',

  args: analyzeMockupArgs,

  async execute(args, _context) {
    try {
      const { imagePath, extractColors = true, extractSpacing = true } = args;

      // Initialize Gemini provider
      const provider = new GeminiProvider();

      // Load the mockup image
      const imageBuffer = await loadImage(imagePath);

      // Build analysis prompt based on extraction options
      const analysisPrompt = buildDesignAnalysisPrompt(extractColors, extractSpacing);

      // Analyze the mockup using Gemini
      const analysis = await provider.analyzeImage(imageBuffer, analysisPrompt);

      // Build summary of what was extracted
      const extractedFeatures: string[] = ['Component Structure', 'Typography'];
      if (extractColors) extractedFeatures.push('Color Palette');
      if (extractSpacing) extractedFeatures.push('Spacing & Layout');

      return `✓ Design Mockup Analysis Complete

Path: ${imagePath}
Extracted: ${extractedFeatures.join(', ')}

${analysis}`;

    } catch (error) {
      if (error instanceof Error && error.message.includes('GEMINI_API_KEY')) {
        return '✗ Error: GEMINI_API_KEY is not set. Please configure your API key in environment variables.';
      }
      if (error instanceof Error && (error.message.includes('ENOENT') || error.message.includes('no such file'))) {
        return `✗ Error: Could not load mockup image at path: ${args.imagePath}. Please verify the file exists.`;
      }
      return `✗ Error analyzing mockup: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
});
