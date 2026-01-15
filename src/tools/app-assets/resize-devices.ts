/**
 * Resize for Devices Tool
 *
 * Smart image resizing to device-specific dimensions with multiple crop modes:
 * - fit: Letterbox if aspect ratio differs
 * - fill: Crop to fill the screen
 * - smart: Use Gemini to identify important content before cropping
 */

import { tool, type ToolDefinition } from '@opencode-ai/plugin/tool';
import { GeminiProvider } from '../../providers/gemini.js';
import { loadImage, saveImage, ensureDirectory } from '../../utils/file-handler.js';
import { resize, crop, getMetadata, type CropRegion } from '../../utils/image-processing.js';
import { IOS_SCREENSHOT_SIZES, type ScreenshotSize } from '../../platforms/ios.js';
import { ANDROID_SCREENSHOT_SIZES, type AndroidScreenshotSize } from '../../platforms/android.js';
import path from 'node:path';

/**
 * Tool args schema
 */
const resizeForDevicesArgs = {
  imagePath: tool.schema.string().describe('Path to the source image to resize'),
  platform: tool.schema.enum(['ios', 'android', 'both']).describe('Target platform(s). Defaults to "both"'),
  screenshotType: tool.schema.enum(['phone', 'tablet', 'all']).optional().describe('Device type to target. Defaults to "all"'),
  cropMode: tool.schema.enum(['fit', 'fill', 'smart']).optional().describe('Resize mode: "fit" letterboxes, "fill" crops to fill, "smart" uses AI to identify important content. Defaults to "fill"'),
  outputDir: tool.schema.string().optional().describe('Custom output directory. Defaults to "./generated-assets/device-screenshots"')
} as const;

/**
 * Unified screenshot size type
 */
type UnifiedScreenshotSize = {
  name: string;
  width: number;
  height: number;
  device: string;
  platform: 'ios' | 'android';
};

/**
 * Convert iOS screenshot size to unified format
 */
function unifyIOSSize(size: ScreenshotSize): UnifiedScreenshotSize {
  return {
    name: size.name,
    width: size.width,
    height: size.height,
    device: size.device,
    platform: 'ios'
  };
}

/**
 * Convert Android screenshot size to unified format
 */
function unifyAndroidSize(size: AndroidScreenshotSize): UnifiedScreenshotSize {
  return {
    name: size.device.replace(/\s+/g, '-').toLowerCase(),
    width: size.width,
    height: size.height,
    device: size.device,
    platform: 'android'
  };
}

/**
 * Filter unified sizes by platform and device type
 */
function filterSizes(
  platform: 'ios' | 'android' | 'both',
  screenshotType: 'phone' | 'tablet' | 'all'
): UnifiedScreenshotSize[] {
  const sizes: UnifiedScreenshotSize[] = [];

  // Add iOS sizes
  if (platform === 'ios' || platform === 'both') {
    const iosSizes = IOS_SCREENSHOT_SIZES.map(unifyIOSSize);

    if (screenshotType === 'phone') {
      sizes.push(...iosSizes.filter(s => s.device.includes('iPhone')));
    } else if (screenshotType === 'tablet') {
      sizes.push(...iosSizes.filter(s => s.device.includes('iPad')));
    } else {
      sizes.push(...iosSizes);
    }
  }

  // Add Android sizes
  if (platform === 'android' || platform === 'both') {
    const androidSizes = ANDROID_SCREENSHOT_SIZES.map(unifyAndroidSize);

    if (screenshotType === 'phone') {
      sizes.push(...androidSizes.filter(s => s.device.toLowerCase().includes('phone')));
    } else if (screenshotType === 'tablet') {
      sizes.push(...androidSizes.filter(s => s.device.toLowerCase().includes('tablet')));
    } else {
      sizes.push(...androidSizes);
    }
  }

  return sizes;
}

/**
 * Calculate smart crop region using Gemini to identify important content
 */
async function calculateSmartCrop(
  imageBuffer: Buffer,
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number
): Promise<CropRegion> {
  const provider = new GeminiProvider();

  // Calculate target aspect ratio
  const targetAspect = targetWidth / targetHeight;
  const sourceAspect = sourceWidth / sourceHeight;

  // If aspects match or source is smaller, no smart crop needed
  if (Math.abs(targetAspect - sourceAspect) < 0.01 || sourceWidth <= targetWidth) {
    return {
      left: 0,
      top: 0,
      width: sourceWidth,
      height: sourceHeight
    };
  }

  // Ask Gemini to identify the most important region
  const prompt = `Analyze this image and identify the most important or interesting region that should be preserved when cropping.

  The image is ${sourceWidth}x${sourceHeight} pixels.
  We need to crop it for a ${targetWidth}x${targetHeight} display (aspect ratio ${targetAspect.toFixed(2)}).

  Please respond with ONLY a JSON object in this exact format:
  {"left": <number>, "top": <number>, "width": <number>, "height": <number>}

  Where:
  - left: x-coordinate of the top-left corner (0 to ${sourceWidth})
  - top: y-coordinate of the top-left corner (0 to ${sourceHeight})
  - width: width of the crop region (maintaining aspect ratio ${targetAspect.toFixed(2)})
  - height: height of the crop region (maintaining aspect ratio ${targetAspect.toFixed(2)})

  Focus on faces, text, or the main subject. Ensure the crop region:
  1. Has aspect ratio close to ${targetAspect.toFixed(2)}
  2. Fits within the image boundaries
  3. Captures the most important content`;

  const analysis = await provider.analyzeImage(imageBuffer, prompt);

  // Parse JSON response
  try {
    // Extract JSON from response (might have markdown code blocks)
    const jsonMatch = analysis.match(/\{[^}]+\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const region = JSON.parse(jsonMatch[0]) as CropRegion;

    // Validate and constrain the region
    const constrainedRegion: CropRegion = {
      left: Math.max(0, Math.min(region.left, sourceWidth - 1)),
      top: Math.max(0, Math.min(region.top, sourceHeight - 1)),
      width: Math.min(region.width, sourceWidth - region.left),
      height: Math.min(region.height, sourceHeight - region.top)
    };

    // Ensure minimum size
    if (constrainedRegion.width < 100 || constrainedRegion.height < 100) {
      throw new Error('Crop region too small');
    }

    return constrainedRegion;
  } catch (error) {
    // Fallback to center crop if AI analysis fails
    console.warn('Smart crop failed, falling back to center crop:', error);

    // Calculate center crop with target aspect ratio
    const cropHeight = targetAspect > sourceAspect
      ? sourceHeight
      : sourceWidth / targetAspect;
    const cropWidth = targetAspect > sourceAspect
      ? sourceHeight * targetAspect
      : sourceWidth;

    return {
      left: Math.floor((sourceWidth - cropWidth) / 2),
      top: Math.floor((sourceHeight - cropHeight) / 2),
      width: Math.floor(cropWidth),
      height: Math.floor(cropHeight)
    };
  }
}

/**
 * Resize image for a specific device size
 */
async function resizeForDevice(
  imageBuffer: Buffer,
  size: UnifiedScreenshotSize,
  cropMode: 'fit' | 'fill' | 'smart'
): Promise<Buffer> {
  const metadata = await getMetadata(imageBuffer);

  if (cropMode === 'fit') {
    // Letterbox mode - contain the image with black bars if needed
    return await resize(imageBuffer, size.width, size.height, {
      fit: 'contain',
      position: 'center',
      background: '#000000'
    });
  } else if (cropMode === 'fill') {
    // Fill mode - crop to fill the screen
    return await resize(imageBuffer, size.width, size.height, {
      fit: 'cover',
      position: 'center'
    });
  } else {
    // Smart mode - use Gemini to identify important content
    const cropRegion = await calculateSmartCrop(
      imageBuffer,
      metadata.width,
      metadata.height,
      size.width,
      size.height
    );

    // First crop to the smart region
    const croppedBuffer = await crop(imageBuffer, cropRegion);

    // Then resize to exact dimensions
    return await resize(croppedBuffer, size.width, size.height, {
      fit: 'fill',
      position: 'center'
    });
  }
}

/**
 * Tool definition for resize_for_devices
 */
export const resizeForDevicesTool: ToolDefinition = tool({
  description: 'Smart image resizing to device-specific dimensions. Supports fit (letterbox), fill (crop), and smart (AI-guided crop) modes.',

  args: resizeForDevicesArgs,

  async execute(args, _context) {
    try {
      const {
        imagePath,
        platform = 'both',
        screenshotType = 'all',
        cropMode = 'fill',
        outputDir = './generated-assets/device-screenshots'
      } = args;

      // Load source image
      const imageBuffer = await loadImage(imagePath);
      const metadata = await getMetadata(imageBuffer);

      // Get target sizes
      const targetSizes = filterSizes(platform, screenshotType);

      if (targetSizes.length === 0) {
        return [
          '✗ Error: No matching device sizes found',
          '',
          `Platform: ${platform}`,
          `Screenshot type: ${screenshotType}`,
          '',
          'Please check your filter settings.'
        ].join('\n');
      }

      // Ensure output directory exists
      await ensureDirectory(outputDir);

      const savedPaths: string[] = [];
      let smartCropWarnings = 0;

      // Resize for each device
      for (const size of targetSizes) {
        try {
          // Create platform/device-specific directory
          const deviceDir = path.join(outputDir, size.platform, size.name);
          await ensureDirectory(deviceDir);

          // Resize image
          const resizedBuffer = await resizeForDevice(imageBuffer, size, cropMode);

          // Save with descriptive filename
          const filename = `${path.basename(imagePath, path.extname(imagePath))}-${size.name}.png`;
          const filepath = await saveImage(resizedBuffer, deviceDir, filename.replace('.png', ''), 0);
          savedPaths.push(filepath);
        } catch (error) {
          // Track smart crop failures but continue
          if (cropMode === 'smart' && error instanceof Error) {
            smartCropWarnings++;
            console.warn(`Smart crop warning for ${size.name}:`, error.message);
          } else {
            throw error;
          }
        }
      }

      const warnings = smartCropWarnings > 0
        ? `\n\n⚠️  ${smartCropWarnings} device(s) used fallback center crop (AI analysis unavailable)`
        : '';

      return [
        `✓ Successfully resized image for ${savedPaths.length} device size(s)`,
        '',
        `Source: ${imagePath} (${metadata.width}x${metadata.height})`,
        `Platform: ${platform}`,
        `Device type: ${screenshotType}`,
        `Crop mode: ${cropMode}`,
        '',
        'Generated sizes:',
        ...savedPaths.slice(0, 10).map((p, i) => `  ${i + 1}. ${p}`),
        savedPaths.length > 10 ? `  ... and ${savedPaths.length - 10} more` : '',
        '',
        `Output directory: ${outputDir}`,
        warnings
      ].filter(Boolean).join('\n');

    } catch (error) {
      // Handle errors with user-friendly messages
      if (error instanceof Error) {
        if (error.message.includes('GEMINI_API_KEY')) {
          return [
            '✗ Error: Gemini API key not found',
            '',
            'Smart crop mode requires GEMINI_API_KEY environment variable.',
            'Get your API key at: https://makersuite.google.com/app/apikey',
            '',
            'Tip: Use cropMode "fit" or "fill" to resize without AI analysis.'
          ].join('\n');
        }

        if (error.message.includes('ENOENT') || error.message.includes('no such file')) {
          return [
            '✗ Error: Source image file not found',
            '',
            `Path: ${args.imagePath}`,
            '',
            'Please check the file path and try again.'
          ].join('\n');
        }

        return [
          '✗ Device resize failed',
          '',
          `Error: ${error.message}`,
          '',
          'Please check your inputs and try again.'
        ].join('\n');
      }

      return '✗ Device resize failed with an unknown error';
    }
  }
});
