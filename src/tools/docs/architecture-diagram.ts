/**
 * Architecture Diagram Tool
 *
 * Generates architecture diagrams from text descriptions using Gemini.
 * Supports multiple output formats: PNG (visual), SVG, or Mermaid (text-based).
 */

import { tool, type ToolDefinition } from '@opencode-ai/plugin/tool';
import { GeminiProvider } from '../../providers/gemini.js';
import { saveImage, getOutputDir } from '../../utils/file-handler.js';

/**
 * Tool args schema
 */
const architectureDiagramArgs = {
  description: tool.schema.string()
    .describe('Description of the architecture to diagram (components, relationships, data flows)'),
  style: tool.schema.enum(['boxes', 'cloud', 'technical'])
    .optional()
    .describe('Visual style for the diagram. Options: boxes (clean box diagrams), cloud (cloud architecture), technical (detailed technical). Defaults to "technical"'),
  format: tool.schema.enum(['png', 'svg', 'mermaid'])
    .optional()
    .describe('Output format. Options: png (image via Gemini), svg (vector image), mermaid (text-based diagram code). Defaults to "png"'),
  outputPath: tool.schema.string()
    .optional()
    .describe('Custom output directory path. Defaults to "./generated-assets"')
} as const;

/**
 * Generate Mermaid diagram code from description
 */
function generateMermaidDiagram(description: string): string {
  // For mermaid format, return a basic template with the description
  // In a real scenario, you might use Gemini to analyze the description
  // and generate proper Mermaid syntax
  const firstLine = description.split('\n')[0] || description;
  const truncatedFirstLine = firstLine.slice(0, 50);

  return `\`\`\`mermaid
graph TB
  %% Architecture Diagram: ${truncatedFirstLine}...

  A[Component A] --> B[Component B]
  B --> C[Component C]
  C --> D[Component D]
  A --> D

  %% Note: This is a template diagram.
  %% For detailed diagrams, use the 'png' or 'svg' format option.
  %% Description provided: ${description}
\`\`\`

**Instructions:**
1. Copy the Mermaid code above
2. Paste it into a Mermaid renderer (GitHub, Mermaid Live Editor, etc.)
3. Customize the diagram based on your architecture requirements

**Description provided:** ${description}
`;
}

/**
 * Build prompt for Gemini based on style
 */
function buildArchitecturePrompt(description: string, style: string): string {
  const basePrompt = `Create a professional architecture diagram based on the following description:\n\n${description}\n\n`;

  const stylePrompts: Record<string, string> = {
    boxes: `Style: Clean box diagram with:
- Simple rectangular boxes for components
- Clear, labeled arrows showing relationships and data flow
- Minimal colors (use white/light gray boxes with black text)
- Clean, professional layout with good spacing
- Component names clearly visible
- Connection labels showing data/control flow`,

    cloud: `Style: Cloud architecture diagram with:
- Cloud-native visual elements (rounded shapes, cloud icons)
- Layer separation (presentation, application, data, infrastructure)
- Cloud service icons or placeholders
- Modern gradient colors (blues, grays, whites)
- Clear service boundaries and regions
- Network connections between services`,

    technical: `Style: Detailed technical diagram with:
- Component boxes with technology stack labels
- Ports and interfaces clearly marked
- Protocol labels on connections (HTTP, TCP, etc.)
- Database and storage symbols
- Network layers and boundaries
- Security zones if applicable
- Detailed annotations and technical specifications`
  };

  const styleGuide = stylePrompts[style] || stylePrompts.technical;

  return `${basePrompt}${styleGuide}

Requirements:
- Professional quality suitable for technical documentation
- Clear visual hierarchy
- All components and connections labeled
- Readable at standard document sizes
- High contrast for clarity`;
}

/**
 * Tool definition for generate_architecture_diagram
 */
export const generateArchitectureDiagramTool: ToolDefinition = tool({
  description: 'Generate architecture diagrams from text descriptions. Supports multiple styles (boxes, cloud, technical) and formats (PNG, SVG, Mermaid).',

  args: architectureDiagramArgs,

  async execute(args, _context) {
    try {
      const {
        description,
        style = 'technical',
        format = 'png',
        outputPath
      } = args;

      // Handle Mermaid format separately (no Gemini needed)
      if (format === 'mermaid') {
        const mermaidCode = generateMermaidDiagram(description);
        return [
          '✓ Generated Mermaid diagram code',
          '',
          mermaidCode,
          '',
          'Note: Mermaid diagrams are text-based and can be rendered in:',
          '  • GitHub markdown files',
          '  • Mermaid Live Editor (https://mermaid.live)',
          '  • Documentation tools that support Mermaid',
          '',
          'For visual diagrams, use format: "png" or "svg"'
        ].join('\n');
      }

      // For PNG/SVG formats, use Gemini
      const provider = new GeminiProvider();
      const outputDir = outputPath || getOutputDir();

      // Build architecture-specific prompt
      const prompt = buildArchitecturePrompt(description, style);

      // Generate diagram using Gemini
      // Note: Gemini generates images, SVG support would require post-processing
      // For now, we'll generate PNG for both png and svg formats
      const imageBuffers = await provider.generateImage(prompt, {
        aspectRatio: '16:9', // Wide format for architecture diagrams
        count: 1
      });

      const buffer = imageBuffers[0];
      if (!buffer) {
        throw new Error('Failed to generate architecture diagram');
      }

      // Save the diagram
      const filename = format === 'svg' ? 'architecture-diagram' : 'architecture-diagram';
      const filepath = await saveImage(buffer, outputDir, filename, 0);

      // SVG note if requested
      const formatNote = format === 'svg'
        ? '\n\nNote: Generated as PNG. For true SVG, consider using Mermaid format or converting with external tools.'
        : '';

      return [
        '✓ Successfully generated architecture diagram',
        '',
        `Saved to: ${filepath}`,
        '',
        `Style: ${style}`,
        `Format: ${format}`,
        `Description: ${description.slice(0, 100)}${description.length > 100 ? '...' : ''}`,
        formatNote
      ].join('\n');

    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('GEMINI_API_KEY')) {
          return [
            '✗ Error: Gemini API key not found',
            '',
            'Please set your GEMINI_API_KEY environment variable.',
            'Get your API key at: https://makersuite.google.com/app/apikey',
            '',
            'Alternative: Use format "mermaid" for text-based diagrams (no API key required)'
          ].join('\n');
        }

        return [
          '✗ Architecture diagram generation failed',
          '',
          `Error: ${error.message}`,
          '',
          'Please check your description and try again.'
        ].join('\n');
      }

      return '✗ Architecture diagram generation failed with an unknown error';
    }
  }
});
