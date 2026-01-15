import { tool, type ToolDefinition } from '@opencode-ai/plugin/tool';
import { GeminiProvider } from '../../providers/gemini.js';
import { saveImage, getOutputDir } from '../../utils/file-handler.js';

/**
 * Tool args schema
 */
const readmeBannerArgs = {
  projectName: tool.schema
    .string()
    .describe('The name of the project'),
  tagline: tool.schema
    .string()
    .optional()
    .describe('Optional tagline or description for the project'),
  style: tool.schema
    .enum(['gradient', 'minimal', 'tech'])
    .optional()
    .describe(
      'Visual style for the banner: gradient (modern colorful), minimal (clean simple), tech (developer-focused). Default: gradient'
    ),
  outputPath: tool.schema
    .string()
    .optional()
    .describe('Custom output path for the banner'),
} as const;

/**
 * Build a style-specific prompt for README banner generation
 */
function buildBannerPrompt(
  projectName: string,
  tagline: string,
  style: string
): string {
  const basePrompt = `Create a professional README banner for the project "${projectName}"${
    tagline ? ` with the tagline: "${tagline}"` : ''
  }. `;

  const stylePrompts: Record<string, string> = {
    gradient: `Use a modern gradient background (purple to blue or teal to cyan).
      Include the project name in large, bold, white text centered on the banner.
      ${tagline ? `Add the tagline in smaller text below the project name.` : ''}
      Make it eye-catching and suitable for GitHub README files.
      Use smooth gradients, subtle geometric shapes, and modern typography.`,

    minimal: `Use a clean, minimal design with a white or very light gray background.
      Display the project name in a bold, sans-serif font in dark gray or black.
      ${tagline ? `Add the tagline in a lighter weight font below the project name.` : ''}
      Keep the design simple and professional with lots of whitespace.
      No decorative elements - focus on typography and clarity.`,

    tech: `Create a technical, developer-focused banner with a dark background (dark blue or charcoal).
      Include subtle code-like elements (brackets, slashes, dots) as decorative accents.
      Display the project name in a monospace or technical font in bright green, cyan, or white.
      ${tagline ? `Add the tagline in a complementary color below the project name.` : ''}
      Use grid patterns, terminal aesthetics, or circuit board motifs for a tech feel.
      Make it appealing to developers and technical audiences.`,
  };

  const styleGuide = stylePrompts[style] || stylePrompts.gradient;

  return `${basePrompt}${styleGuide}

Requirements:
- Banner size should be wide (2:1 aspect ratio, ideal for GitHub)
- High quality, professional appearance
- Text must be clearly readable
- Centered composition
- Suitable for use at the top of README.md files`;
}

/**
 * Tool definition for generate_readme_banner
 */
export const generateReadmeBannerTool: ToolDefinition = tool({
  description: 'Generate a professional README banner image for your project with customizable styles (gradient, minimal, tech). Creates 1280x640 images optimized for GitHub.',

  args: readmeBannerArgs,

  async execute(args, _context) {
    try {
      const projectName = args.projectName as string;
      const tagline = (args.tagline as string | undefined) || '';
      const style = (args.style as 'gradient' | 'minimal' | 'tech' | undefined) || 'gradient';
      const outputPath = args.outputPath as string | undefined;

      const provider = new GeminiProvider();

      // Build style-specific prompt
      const prompt = buildBannerPrompt(projectName, tagline, style);

      // Generate 1280x640 banner (2:1 aspect ratio, standard for GitHub)
      // Use 16:9 as closest available aspect ratio to 2:1 for wide banners
      const images = await provider.generateImage(prompt, {
        aspectRatio: '16:9',
        count: 1,
      });

      if (images.length === 0) {
        return '❌ Failed to generate README banner';
      }

      const buffer = images[0];
      if (!buffer) {
        return '❌ Failed to generate README banner';
      }

      // Save the banner
      const outputDir = outputPath || getOutputDir();
      const filename = `${projectName.toLowerCase().replace(/\s+/g, '-')}-banner`;

      const savedPath = await saveImage(buffer, outputDir, filename, 0);

      return `✅ README banner generated successfully!
Style: ${style}
Size: 1280x640 (optimized for GitHub)
Saved to: ${savedPath}

Add to your README.md:
![${projectName}](${savedPath})`;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          return '❌ Gemini API key not configured. Set GEMINI_API_KEY environment variable.';
        }
        return `❌ Error generating README banner: ${error.message}`;
      }
      return '❌ Unknown error generating README banner';
    }
  },
} satisfies ToolDefinition);
