/**
 * Device Mockup Tool
 *
 * Places screenshots in realistic device frames for App Store/marketing materials.
 * Supports iPhone, iPad, and various device colors/orientations.
 */

import { tool, type ToolDefinition } from '@opencode-ai/plugin/tool';
import { GeminiProvider } from '../../providers/gemini.js';
import { loadImage, saveImage, ensureDirectory, getOutputDir } from '../../utils/file-handler.js';
import { getMetadata } from '../../utils/image-processing.js';
import * as path from 'path';

// Device specifications
const DEVICE_SPECS = {
  // iPhone 16 Series
  'iphone-16-pro-max': { displaySize: '6.9"', aspectRatio: '19.5:9', family: 'iPhone 16' },
  'iphone-16-pro': { displaySize: '6.3"', aspectRatio: '19.5:9', family: 'iPhone 16' },
  'iphone-16-plus': { displaySize: '6.7"', aspectRatio: '19.5:9', family: 'iPhone 16' },
  'iphone-16': { displaySize: '6.1"', aspectRatio: '19.5:9', family: 'iPhone 16' },

  // iPhone 15 Series
  'iphone-15-pro-max': { displaySize: '6.7"', aspectRatio: '19.5:9', family: 'iPhone 15' },
  'iphone-15-pro': { displaySize: '6.1"', aspectRatio: '19.5:9', family: 'iPhone 15' },
  'iphone-15-plus': { displaySize: '6.7"', aspectRatio: '19.5:9', family: 'iPhone 15' },
  'iphone-15': { displaySize: '6.1"', aspectRatio: '19.5:9', family: 'iPhone 15' },

  // iPad Pro Series
  'ipad-pro-12.9': { displaySize: '12.9"', aspectRatio: '4:3', family: 'iPad Pro' },
  'ipad-pro-11': { displaySize: '11"', aspectRatio: '4.3:3', family: 'iPad Pro' },

  // iPad Air & mini
  'ipad-air': { displaySize: '10.9"', aspectRatio: '4.3:3', family: 'iPad Air' },
  'ipad-mini': { displaySize: '8.3"', aspectRatio: '4:3', family: 'iPad mini' },
} as const;

type DeviceModel = keyof typeof DEVICE_SPECS;

// Device colors are validated softly - any color string is accepted for flexibility
// Common options: silver, black, gold, titanium, blue, pink, green, purple, white, space-gray

const generateDeviceMockupArgs = {
  imagePath: tool.schema.string().describe('Path to the screenshot image to place in device frame'),
  device: tool.schema.string().describe(
    'Device model: iphone-16-pro-max, iphone-16-pro, iphone-16-plus, iphone-16, iphone-15-pro-max, iphone-15-pro, iphone-15-plus, iphone-15, ipad-pro-12.9, ipad-pro-11, ipad-air, ipad-mini'
  ),
  color: tool.schema.string().optional().describe(
    'Device color: silver, black, gold, titanium, blue, pink, green, purple, white, space-gray. Defaults to black.'
  ),
  orientation: tool.schema.string().optional().describe(
    'Device orientation: portrait or landscape. Defaults to portrait.'
  ),
  outputPath: tool.schema.string().optional().describe(
    'Custom output path for the mockup. Defaults to "./generated-assets/mockups/{device}-mockup.png"'
  ),
} as const;

export const generateDeviceMockup: ToolDefinition = tool({
  description: 'Generate a realistic device mockup by placing a screenshot in a device frame. Supports iPhone 15/16 series and iPad models with various colors and orientations.',

  args: generateDeviceMockupArgs,

  async execute(args, _context) {
    try {
      // Initialize Gemini provider
      const gemini = new GeminiProvider();

      // Extract and validate parameters
      const {
        imagePath,
        device,
        color = 'black',
        orientation = 'portrait',
        outputPath: customOutputPath,
      } = args;

      // Validate device
      if (!(device in DEVICE_SPECS)) {
        const availableDevices = Object.keys(DEVICE_SPECS).join(', ');
        return `❌ Invalid device model. Available devices: ${availableDevices}`;
      }

      const deviceModel = device as DeviceModel;
      const deviceSpec = DEVICE_SPECS[deviceModel];

      // Validate color (soft validation - allow any color for flexibility)
      const normalizedColor = color.toLowerCase();

      // Validate orientation
      if (orientation !== 'portrait' && orientation !== 'landscape') {
        return `❌ Invalid orientation. Must be 'portrait' or 'landscape'.`;
      }

      // Load the screenshot image
      console.log(`Loading screenshot from ${imagePath}...`);
      const screenshotBuffer = await loadImage(imagePath);

      // Get screenshot metadata
      const metadata = await getMetadata(screenshotBuffer);
      console.log(`Screenshot loaded: ${metadata.width}x${metadata.height}`);

      // Determine output path
      const baseOutputDir = getOutputDir();
      const mockupsDir = path.join(baseOutputDir, 'mockups');
      await ensureDirectory(mockupsDir);

      // Prepare device filename for output
      const deviceFileName = `${deviceModel}-${normalizedColor}-${orientation}-mockup`;

      // Create a detailed prompt for Gemini to generate the mockup
      const mockupPrompt = buildMockupPrompt(
        deviceSpec,
        deviceModel,
        normalizedColor,
        orientation
      );

      console.log('Generating device mockup with Gemini...');

      // Use Gemini's image editing capability to composite the screenshot into a device frame
      // Strategy: Ask Gemini to generate a device frame with the screenshot placed inside
      const mockupBuffer = await gemini.editImage(
        screenshotBuffer,
        mockupPrompt
      );

      // Save the mockup
      const savedPath = customOutputPath
        ? await saveImage(mockupBuffer, path.dirname(customOutputPath), path.basename(customOutputPath, path.extname(customOutputPath)), 0)
        : await saveImage(mockupBuffer, mockupsDir, deviceFileName, 0);

      return `✅ Device mockup generated successfully!\n\nDevice: ${deviceSpec.family} (${deviceSpec.displaySize})\nColor: ${normalizedColor}\nOrientation: ${orientation}\nOutput: ${savedPath}`;
    } catch (error) {
      if (error instanceof Error) {
        return `❌ Failed to generate device mockup: ${error.message}`;
      }
      return '❌ Failed to generate device mockup: Unknown error';
    }
  },
});

/**
 * Build a detailed prompt for Gemini to generate realistic device mockup
 */
function buildMockupPrompt(
  deviceSpec: typeof DEVICE_SPECS[DeviceModel],
  deviceModel: DeviceModel,
  color: string,
  orientation: string
): string {
    const isIPad = deviceModel.includes('ipad');
    const deviceType = isIPad ? 'iPad' : 'iPhone';
    const deviceName = deviceSpec.family;

    // Build comprehensive prompt
    let prompt = `Place this screenshot inside a realistic ${deviceName} device mockup. `;

    // Device specifications
    prompt += `The device should be a ${deviceName} with a ${deviceSpec.displaySize} display. `;
    prompt += `Device color/finish: ${color}. `;
    prompt += `Orientation: ${orientation}. `;

    // Frame details based on device type
    if (deviceType === 'iPhone') {
      if (deviceModel.includes('16-pro') || deviceModel.includes('15-pro')) {
        prompt += `Include the distinctive titanium frame with rounded corners. `;
        prompt += `Show the Dynamic Island at the top of the screen. `;
        prompt += `Add subtle reflections on the titanium edges. `;
      } else {
        prompt += `Include the aluminum frame with rounded corners. `;
        prompt += `Show the notch at the top of the screen. `;
      }
      prompt += `Include the volume buttons on the left side and power button on the right. `;
    } else {
      // iPad
      prompt += `Include the thin aluminum bezel with rounded corners characteristic of modern iPads. `;
      prompt += `Show the minimal bezels around the display. `;
      if (deviceModel.includes('pro')) {
        prompt += `Include the flat squared-off edges of the iPad Pro design. `;
      }
    }

    // Composition and lighting
    prompt += `The screenshot should be perfectly fitted within the device screen area with accurate proportions. `;
    prompt += `Add realistic lighting and shadows to make the device appear three-dimensional. `;
    prompt += `Include subtle screen glare and reflections for realism. `;
    prompt += `The device should be centered on a clean white or light gray background. `;
    prompt += `Add a soft drop shadow beneath the device for depth. `;

    // Final quality requirements
    prompt += `The result should look professional and suitable for App Store marketing materials. `;
    prompt += `Ensure the screenshot content is clearly visible and not distorted.`;

    return prompt;
}
