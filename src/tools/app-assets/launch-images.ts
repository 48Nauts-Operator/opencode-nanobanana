import { tool, type ToolDefinition } from '@opencode-ai/plugin/tool';
import { GeminiProvider } from '../../providers/gemini.js';
import { loadImage, saveImage, ensureDirectory } from '../../utils/file-handler.js';
import { resize } from '../../utils/image-processing.js';
import { IOS_SCREENSHOT_SIZES } from '../../platforms/ios.js';
import { ANDROID_SCREENSHOT_SIZES } from '../../platforms/android.js';
import * as path from 'path';
import * as fs from 'fs/promises';

const args = {
  design: tool.schema.string().describe('Text description of splash screen design OR path to existing image file'),
  platforms: tool.schema.array(tool.schema.enum(['ios', 'android'])).optional().describe('Target platforms (default: both)'),
  includeAllSizes: tool.schema.boolean().optional().describe('Generate for all device sizes (default: true)'),
  outputDir: tool.schema.string().optional().describe('Custom output directory (default: generated-assets/launch-images)'),
} as const;

/**
 * Determines if the design input is a file path or a text description
 */
function isFilePath(design: string): boolean {
  // Check if it's a valid path pattern (has extension or path separators)
  return design.includes('/') || design.includes('\\') || /\.(png|jpg|jpeg|webp)$/i.test(design);
}

/**
 * Get all launch image sizes for specified platforms
 */
function getLaunchImageSizes(platforms: string[]) {
  const sizes: Array<{ width: number; height: number; name: string; platform: string }> = [];

  if (platforms.includes('ios')) {
    // Use iOS screenshot sizes as launch image sizes (same dimensions)
    IOS_SCREENSHOT_SIZES.forEach((size) => {
      sizes.push({
        width: size.width,
        height: size.height,
        name: size.device,
        platform: 'ios',
      });
    });
  }

  if (platforms.includes('android')) {
    // Use Android screenshot sizes as launch image sizes
    ANDROID_SCREENSHOT_SIZES.forEach((size) => {
      sizes.push({
        width: size.width,
        height: size.height,
        name: size.device,
        platform: 'android',
      });
    });
  }

  return sizes;
}

/**
 * Generate launch images from text description using Gemini
 */
async function generateFromPrompt(
  design: string,
  sizes: Array<{ width: number; height: number; name: string; platform: string }>,
  outputDir: string
): Promise<string[]> {
  const gemini = new GeminiProvider();
  const generatedPaths: string[] = [];

  // Group sizes by aspect ratio to minimize API calls
  const aspectRatioGroups = new Map<string, typeof sizes>();

  for (const size of sizes) {
    const aspectRatio = size.width / size.height;
    const key = aspectRatio < 1 ? '9:16' : '16:9'; // Portrait or landscape

    if (!aspectRatioGroups.has(key)) {
      aspectRatioGroups.set(key, []);
    }
    aspectRatioGroups.get(key)!.push(size);
  }

  // Generate one master image per aspect ratio, then resize
  for (const [aspectRatio, groupSizes] of aspectRatioGroups) {
    // Generate master splash screen
    const prompt = `Create a professional mobile app splash screen / launch screen with this design: ${design}.
Aspect ratio: ${aspectRatio}.
The design should be clean, minimal, centered, and work well as an app loading screen.
Include any branding, logo, or visual elements described.
Ensure the design works for ${aspectRatio === '9:16' ? 'portrait' : 'landscape'} orientation.`;

    const images = await gemini.generateImage(prompt, { aspectRatio: aspectRatio as '9:16' | '16:9' });
    const masterImage = images[0];

    if (!masterImage) {
      throw new Error(`Failed to generate splash screen for aspect ratio ${aspectRatio}`);
    }

    // Resize to all sizes in this group
    for (const size of groupSizes) {
      const platformDir = path.join(outputDir, size.platform);
      await ensureDirectory(platformDir);

      const resized = await resize(masterImage, size.width, size.height, { fit: 'cover' });
      const filename = `launch-${size.name}.png`;
      const outputPath = await saveImage(resized, platformDir, filename, 0);

      generatedPaths.push(outputPath);
    }
  }

  return generatedPaths;
}

/**
 * Generate launch images from existing image file
 */
async function generateFromImage(
  imagePath: string,
  sizes: Array<{ width: number; height: number; name: string; platform: string }>,
  outputDir: string
): Promise<string[]> {
  const generatedPaths: string[] = [];

  // Load source image
  const sourceImage = await loadImage(imagePath);

  // Resize to all requested sizes
  for (const size of sizes) {
    const platformDir = path.join(outputDir, size.platform);
    await ensureDirectory(platformDir);

    // Use 'cover' fit to fill the screen without letterboxing
    const resized = await resize(sourceImage, size.width, size.height, { fit: 'cover' });
    const filename = `launch-${size.name}.png`;
    const outputPath = await saveImage(resized, platformDir, filename, 0);

    generatedPaths.push(outputPath);
  }

  return generatedPaths;
}

export const generate_launch_images: ToolDefinition = tool({
  description: 'Generate splash screens / launch images for iOS and Android apps from text description or existing image',
  args,
  execute: async (args, _context) => {
    try {
      const {
        design,
        platforms = ['ios', 'android'],
        outputDir = path.join(process.cwd(), 'generated-assets', 'launch-images')
      } = args;

      // Ensure output directory exists
      await ensureDirectory(outputDir);

      // Get all launch image sizes for specified platforms
      const sizes = getLaunchImageSizes(platforms);

      if (sizes.length === 0) {
        return 'No devices found for the specified platforms. Please check your platform selection.';
      }

      // Determine if input is a file path or text description
      const isImage = isFilePath(design);

      let generatedPaths: string[];

      if (isImage) {
        // Check if file exists
        try {
          await fs.access(design);
        } catch {
          return `Image file not found: ${design}`;
        }

        // Generate from existing image
        generatedPaths = await generateFromImage(design, sizes, outputDir);
      } else {
        // Generate from text description using Gemini
        generatedPaths = await generateFromPrompt(design, sizes, outputDir);
      }

      // Group paths by platform for cleaner output message
      const iosPaths = generatedPaths.filter(p => p.includes('/ios/'));
      const androidPaths = generatedPaths.filter(p => p.includes('/android/'));

      let message = `Successfully generated ${generatedPaths.length} launch images!\n\n`;

      if (iosPaths.length > 0) {
        const firstIosPath = iosPaths[0];
        if (firstIosPath) {
          message += `iOS Launch Images (${iosPaths.length}):\n`;
          message += `  ${path.dirname(firstIosPath)}/\n`;
        }
      }

      if (androidPaths.length > 0) {
        const firstAndroidPath = androidPaths[0];
        if (firstAndroidPath) {
          message += `Android Launch Images (${androidPaths.length}):\n`;
          message += `  ${path.dirname(firstAndroidPath)}/\n`;
        }
      }

      message += `\nAll images saved to: ${outputDir}`;

      return message;

    } catch (error) {
      if (error instanceof Error && error.message.includes('GEMINI_API_KEY')) {
        return 'Gemini API key not configured. Please set GEMINI_API_KEY environment variable.';
      }
      return `Failed to generate launch images: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
});
