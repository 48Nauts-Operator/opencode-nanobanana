import { tool, type ToolDefinition } from '@opencode-ai/plugin/tool';
import { GeminiProvider } from '../../providers/gemini.js';
import { loadImage, saveVideo, getOutputDir } from '../../utils/file-handler.js';

const imageToVideoArgs = {
  imagePath: tool.schema.string().describe('Path to the image to animate'),
  motion: tool.schema
    .string()
    .optional()
    .describe(
      'Description of the motion/animation (e.g., "zoom in slowly", "pan right", "rotate clockwise"). Default: subtle natural movement'
    ),
  duration: tool.schema.number().optional().describe('Video duration in seconds (default: 5)'),
  aspectRatio: tool.schema
    .enum(['16:9', '9:16', '1:1', '4:3', '3:4'])
    .optional()
    .describe('Video aspect ratio (default: 16:9)'),
  outputPath: tool.schema.string().optional().describe('Custom output path for the video'),
} as const;

export const imageToVideoTool: ToolDefinition = tool({
  description: 'Animate a static image into a video with motion',
  args: imageToVideoArgs,
  async execute(args, _context) {
    try {
      const gemini = new GeminiProvider();
      const { imagePath, motion, duration = 5, aspectRatio = '16:9', outputPath } = args;

      // Load the source image
      const imageBuffer = await loadImage(imagePath);

      // Animate the image using Veo
      const videoBuffer = await gemini.animateImage(imageBuffer, motion, {
        duration,
        aspectRatio,
      });

      // Save the video
      const outputDir = outputPath ? undefined : getOutputDir();
      const basePrompt = motion || 'animated';
      const videoPath = await saveVideo(videoBuffer, outputDir, basePrompt);

      const motionDesc = motion ? ` with motion: "${motion}"` : ' with subtle natural movement';
      return `✅ Image animated successfully!\nSource: ${imagePath}\nSaved to: ${videoPath}\nDuration: ${duration}s, Aspect Ratio: ${aspectRatio}${motionDesc}`;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('GEMINI_API_KEY')) {
          return '❌ Error: GEMINI_API_KEY environment variable not set. Please set it to use image animation.';
        }
        if (error.message.includes('ENOENT') || error.message.includes('no such file')) {
          return `❌ Error: Image file not found at path: ${args.imagePath}`;
        }
        return `❌ Error animating image: ${error.message}`;
      }
      return '❌ Error: An unexpected error occurred during image animation.';
    }
  },
});
