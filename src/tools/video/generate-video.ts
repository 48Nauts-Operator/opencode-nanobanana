import { tool, type ToolDefinition } from '@opencode-ai/plugin/tool';
import { GeminiProvider } from '../../providers/gemini.js';
import { saveVideo, getOutputDir } from '../../utils/file-handler.js';

const generateVideoArgs = {
  prompt: tool.schema.string().describe('Description of the video to generate'),
  duration: tool.schema.number().optional().describe('Video duration in seconds (default: 5)'),
  aspectRatio: tool.schema
    .enum(['16:9', '9:16', '1:1', '4:3', '3:4'])
    .optional()
    .describe('Video aspect ratio (default: 16:9)'),
  outputPath: tool.schema.string().optional().describe('Custom output path for the video'),
} as const;

export const generateVideoTool: ToolDefinition = tool({
  description: 'Generate a video from a text prompt using Google Veo',
  args: generateVideoArgs,
  async execute(args, _context) {
    try {
      const gemini = new GeminiProvider();
      const { prompt, duration = 5, aspectRatio = '16:9', outputPath } = args;

      // Generate video using Veo
      const videoBuffer = await gemini.generateVideo(prompt, {
        duration,
        aspectRatio,
      });

      // Save the video
      const outputDir = outputPath ? undefined : getOutputDir();
      const videoPath = await saveVideo(videoBuffer, outputDir, prompt);

      return `✅ Video generated successfully!\nSaved to: ${videoPath}\nDuration: ${duration}s, Aspect Ratio: ${aspectRatio}`;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('GEMINI_API_KEY')) {
          return '❌ Error: GEMINI_API_KEY environment variable not set. Please set it to use video generation.';
        }
        return `❌ Error generating video: ${error.message}`;
      }
      return '❌ Error: An unexpected error occurred during video generation.';
    }
  },
});
