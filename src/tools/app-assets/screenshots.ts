/**
 * Generate App Screenshots Tool
 *
 * Creates App Store screenshots for iOS and iPad devices.
 * Supports two modes:
 * - 'image': Resizes existing image to all device dimensions
 * - 'code': Generates visuals from code/design description via Gemini
 */

import { tool, type ToolDefinition } from '@opencode-ai/plugin/tool';
import { GeminiProvider } from '../../providers/gemini.js';
import { loadImage, saveImage, ensureDirectory } from '../../utils/file-handler.js';
import { resize } from '../../utils/image-processing.js';
import { IOS_SCREENSHOT_SIZES, type ScreenshotSize } from '../../platforms/ios.js';
import path from 'node:path';

/**
 * Tool args schema
 */
const generateScreenshotsArgs = {
  source: tool.schema.string().describe('Source content: image path for "image" mode, or description for "code" mode'),
  sourceType: tool.schema.enum(['image', 'code']).describe('Type of source: "image" to resize existing image, or "code" to generate from description'),
  platforms: tool.schema.array(tool.schema.enum(['ios', 'ipad'])).optional().describe('Target platforms. Defaults to ["ios", "ipad"]'),
  devices: tool.schema.array(tool.schema.string()).optional().describe('Specific devices to target (e.g., ["6.9-inch", "iPad-12.9"]). Defaults to all devices'),
  addDeviceFrame: tool.schema.boolean().optional().describe('Add device frame to screenshots (future feature). Defaults to false'),
  outputDir: tool.schema.string().optional().describe('Custom output directory. Defaults to "./generated-assets/screenshots"')
} as const;

/**
 * Filter screenshot sizes by platform
 */
function filterByPlatform(sizes: ScreenshotSize[], platforms: string[]): ScreenshotSize[] {
  return sizes.filter(size => {
    const isPhone = size.device.includes('iPhone');
    const isTablet = size.device.includes('iPad');

    if (platforms.includes('ios') && isPhone) return true;
    if (platforms.includes('ipad') && isTablet) return true;

    return false;
  });
}

/**
 * Filter screenshot sizes by device names
 */
function filterByDevices(sizes: ScreenshotSize[], deviceNames: string[]): ScreenshotSize[] {
  return sizes.filter(size => deviceNames.includes(size.name));
}

/**
 * Tool definition for generate_app_screenshots
 */
export const generateScreenshotsTool: ToolDefinition = tool({
  description: 'Generate App Store screenshots for iOS and iPad devices. Supports resizing existing images or generating from code/design descriptions.',

  args: generateScreenshotsArgs,

  async execute(args, _context) {
    try {
      const {
        source,
        sourceType,
        platforms = ['ios', 'ipad'],
        devices,
        addDeviceFrame = false,
        outputDir = './generated-assets/screenshots'
      } = args;

      // Ensure output directory exists
      await ensureDirectory(outputDir);

      // Filter screenshot sizes based on platforms and devices
      let targetSizes = IOS_SCREENSHOT_SIZES;

      if (platforms.length > 0) {
        targetSizes = filterByPlatform(targetSizes, platforms);
      }

      if (devices && devices.length > 0) {
        targetSizes = filterByDevices(targetSizes, devices);
      }

      if (targetSizes.length === 0) {
        return [
          '✗ Error: No matching devices found',
          '',
          `Platforms: ${platforms.join(', ')}`,
          devices ? `Devices: ${devices.join(', ')}` : '',
          '',
          'Available devices:',
          ...IOS_SCREENSHOT_SIZES.map(s => `  - ${s.name} (${s.device})`)
        ].join('\n');
      }

      const savedPaths: string[] = [];

      if (sourceType === 'image') {
        // Mode 1: Resize existing image to all device dimensions
        const sourceBuffer = await loadImage(source);

        for (const size of targetSizes) {
          // Create device-specific directory
          const deviceDir = path.join(outputDir, size.name);
          await ensureDirectory(deviceDir);

          // Resize image to device dimensions
          // Using 'cover' fit mode to fill the screen without letterboxing
          const resizedBuffer = await resize(sourceBuffer, size.width, size.height, {
            fit: 'cover',
            position: 'center'
          });

          // Save screenshot
          const filename = `screenshot-${size.name}.png`;
          const filepath = path.join(deviceDir, filename);

          // Save using our file handler (it returns the path)
          await saveImage(resizedBuffer, deviceDir, `screenshot-${size.name}`, 0);
          savedPaths.push(filepath);
        }

        return [
          `✓ Successfully resized image to ${targetSizes.length} device screenshot(s)`,
          '',
          `Source: ${source}`,
          `Mode: Resize from image`,
          '',
          'Generated screenshots:',
          ...savedPaths.map((p, i) => `  ${i + 1}. ${p}`),
          '',
          `Output directory: ${outputDir}`
        ].join('\n');

      } else {
        // Mode 2: Generate visuals from code/design description via Gemini
        const provider = new GeminiProvider();

        for (const size of targetSizes) {
          // Create device-specific directory
          const deviceDir = path.join(outputDir, size.name);
          await ensureDirectory(deviceDir);

          // Generate screenshot for this specific device size
          const prompt = [
            source,
            '',
            `Generate an App Store screenshot for ${size.device} (${size.width}x${size.height}px).`,
            'The screenshot should be visually polished and ready for App Store submission.',
            addDeviceFrame ? 'Include the device frame in the screenshot.' : ''
          ].filter(Boolean).join('\n');

          const imageBuffers = await provider.generateImage(prompt, {
            aspectRatio: size.width > size.height ? '9:16' : '16:9',
            count: 1
          });

          const buffer = imageBuffers[0];
          if (!buffer) {
            throw new Error(`Failed to generate screenshot for ${size.device}`);
          }

          // Resize to exact device dimensions
          const resizedBuffer = await resize(buffer, size.width, size.height, {
            fit: 'cover',
            position: 'center'
          });

          // Save screenshot
          const filepath = await saveImage(resizedBuffer, deviceDir, `screenshot-${size.name}`, 0);
          savedPaths.push(filepath);
        }

        return [
          `✓ Successfully generated ${targetSizes.length} screenshot(s) from description`,
          '',
          `Description: "${source}"`,
          `Mode: Generated via Gemini`,
          '',
          'Generated screenshots:',
          ...savedPaths.map((p, i) => `  ${i + 1}. ${p}`),
          '',
          `Output directory: ${outputDir}`
        ].join('\n');
      }

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

        if (error.message.includes('ENOENT') || error.message.includes('no such file')) {
          return [
            '✗ Error: Source image file not found',
            '',
            `Path: ${args.source}`,
            '',
            'Please check the file path and try again.'
          ].join('\n');
        }

        return [
          '✗ Screenshot generation failed',
          '',
          `Error: ${error.message}`,
          '',
          'Please check your inputs and try again.'
        ].join('\n');
      }

      return '✗ Screenshot generation failed with an unknown error';
    }
  }
});
