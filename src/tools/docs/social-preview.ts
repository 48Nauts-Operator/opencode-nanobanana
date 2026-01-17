import { tool, type ToolDefinition } from '@opencode-ai/plugin/tool';
import { GeminiProvider } from '../../providers/gemini.js';
import { saveImage, getOutputDir } from '../../utils/file-handler.js';

const socialPreviewArgs = {
  projectName: tool.schema.string().describe('The name of the project'),
  description: tool.schema.string().optional().describe('A brief description or tagline for the project'),
  style: tool.schema
    .enum(['gradient', 'minimal', 'bold'])
    .optional()
    .describe("Visual style for the preview: 'gradient' (colorful modern), 'minimal' (clean simple), or 'bold' (high-contrast attention-grabbing)"),
  outputPath: tool.schema
    .string()
    .optional()
    .describe('Optional custom output path for the social preview image'),
} as const;

/**
 * Generate Social Preview (Open Graph) Image Tool
 *
 * Creates 1200x630 Open Graph images for social media sharing (Facebook, Twitter, LinkedIn).
 * These images appear when your project is shared on social platforms.
 *
 * Open Graph standard size: 1200x630 pixels (1.91:1 aspect ratio)
 */
export const generateSocialPreview: ToolDefinition = tool({
  description: 'Generate a social media preview (Open Graph) image for project sharing',
  args: socialPreviewArgs,
  execute: async (args, _context) => {
    try {
      // Extract arguments with defaults
      const projectName = args.projectName as string;
      const description = (args.description as string | undefined) || '';
      const style = (args.style as 'gradient' | 'minimal' | 'bold' | undefined) || 'gradient';
      const customOutputPath = args.outputPath as string | undefined;

      // Initialize Gemini provider
      const gemini = new GeminiProvider();

      // Build the generation prompt based on style
      const prompt = buildSocialPreviewPrompt(projectName, description, style);

      // Generate the social preview image (1200x630 = 1.91:1, use 16:9 as closest Gemini option)
      const imageBuffers = await gemini.generateImage(prompt, {
        aspectRatio: '16:9', // Closest to 1.91:1
        count: 1,
      });

      if (imageBuffers.length === 0) {
        return '❌ Failed to generate social preview image';
      }

      const buffer = imageBuffers[0];
      if (!buffer) {
        return '❌ Failed to generate social preview image';
      }

      // Save the image
      const outputDir = customOutputPath || getOutputDir();
      const filename = `${projectName.toLowerCase().replace(/\s+/g, '-')}-social-preview`;
      const savedPath = await saveImage(
        buffer,
        outputDir,
        filename,
        0
      );

      // Return success message with usage instructions
      return `✅ Generated ${style} style social preview (1200x630) at: ${savedPath}

📝 Add this to your HTML <head>:
\`\`\`html
<meta property="og:image" content="${savedPath}" />
<meta property="og:title" content="${projectName}" />
<meta property="og:description" content="${description || 'Your project description'}" />
<meta name="twitter:card" content="summary_large_image" />
\`\`\``;
    } catch (error) {
      if (error instanceof Error && error.message.includes('API key')) {
        return '❌ GEMINI_API_KEY environment variable is not set. Please configure your API key.';
      }
      return `❌ Error generating social preview: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
});

/**
 * Build style-specific generation prompt for social preview images
 */
function buildSocialPreviewPrompt(
  projectName: string,
  description: string,
  style: 'gradient' | 'minimal' | 'bold'
): string {
  const basePrompt = `Create a professional social media preview image (Open Graph) for a project called "${projectName}"${
    description ? ` with the description: "${description}"` : ''
  }.`;

  const styleGuide = {
    gradient: `
Use a modern gradient background (purple-to-blue, teal-to-cyan, or orange-to-pink).
Display the project name prominently in bold white text (large, sans-serif font).
${description ? 'Show the description below in smaller white text.' : ''}
Add subtle geometric shapes or abstract elements in the background.
Create depth with overlapping gradients and soft shadows.
Professional, modern, eye-catching design suitable for social media.`,

    minimal: `
Use a clean white or very light gray background.
Display the project name in bold, large black text (modern sans-serif).
${description ? 'Show the description below in smaller dark gray text.' : ''}
Embrace whitespace - keep the design simple and uncluttered.
Add a single accent color (blue, teal, or purple) as a subtle line or dot.
Minimalist, professional, clean aesthetic.`,

    bold: `
Use a high-contrast design with vibrant colors.
Dark background (navy blue, deep purple, or black) with bright accent colors.
Display the project name in extra-bold, large white or yellow text.
${description ? 'Show the description in bright white text below.' : ''}
Add dramatic lighting effects, glows, or neon-style elements.
Create a strong visual impact - this should grab attention immediately.
Bold, modern, energetic design.`,
  }[style];

  return `${basePrompt}${styleGuide}

Requirements:
- Image must be in landscape orientation (wider than tall) at approximately 1200x630 pixels ratio
- Text must be large and highly readable even at small sizes
- Composition should be centered and balanced
- Professional quality suitable for social media sharing (Facebook, Twitter, LinkedIn)
- Design should work well as a thumbnail preview`;
}
