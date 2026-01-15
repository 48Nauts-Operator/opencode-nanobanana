/**
 * Generate App Icon Tool
 *
 * Creates complete app icon sets for iOS and Android platforms.
 * Generates 1024x1024 master icon via Gemini, then resizes to all required sizes.
 */

import { tool, type ToolDefinition } from '@opencode-ai/plugin/tool';
import { GeminiProvider } from '../../providers/gemini.js';
import { ensureDirectory, getOutputDir } from '../../utils/file-handler.js';
import { resize } from '../../utils/image-processing.js';
import {
  IOS_ICON_SIZES,
  WATCHOS_ICON_SIZES,
  CARPLAY_ICON_SIZES,
  generateContentsJson,
  type IconSize,
} from '../../platforms/ios.js';
import {
  ANDROID_ICON_SIZES,
  generateAdaptiveIconXml,
} from '../../platforms/android.js';
import * as fs from 'fs/promises';
import * as path from 'path';

const generateAppIconArgs = {
  prompt: tool.schema.string().describe('Description of the app icon to generate'),
  platforms: tool.schema
    .array(tool.schema.string())
    .optional()
    .describe('Target platforms: ["ios", "android"] or ["ios"] or ["android"]. Defaults to both.'),
  includeWatchOS: tool.schema.boolean().optional().describe('Include watchOS icon sizes. Defaults to false.'),
  includeCarPlay: tool.schema.boolean().optional().describe('Include CarPlay icon sizes. Defaults to false.'),
  outputDir: tool.schema.string().optional().describe('Custom output directory. Defaults to "./generated-assets/app-icons"'),
} as const;

export const generateAppIcon: ToolDefinition = tool({
  description: 'Generate complete app icon sets for iOS and Android from a text prompt. Creates 1024x1024 master icon and resizes to all required platform sizes.',

  args: generateAppIconArgs,

  async execute(args, _context) {
    try {
      // Initialize Gemini provider
      const gemini = new GeminiProvider();

      // Extract parameters with defaults
      const {
        prompt,
        platforms = ['ios', 'android'],
        includeWatchOS = false,
        includeCarPlay = false,
        outputDir: customOutputDir
      } = args;

      // Determine output directory
      const baseOutputDir = customOutputDir || getOutputDir();
      const iconOutputDir = path.join(baseOutputDir, 'app-icons');
      await ensureDirectory(iconOutputDir);

      // Generate 1024x1024 master icon
      console.log('Generating 1024x1024 master icon...');
      const masterIcons = await gemini.generateImage(
        `App icon: ${prompt}. Professional, simple, clean design suitable for a mobile app icon. Square format, centered composition.`,
        { aspectRatio: '1:1', count: 1 }
      );

      if (masterIcons.length === 0) {
        return 'Failed to generate master icon';
      }

      const masterIcon = masterIcons[0];
      if (!masterIcon) {
        return 'Failed to generate master icon';
      }

      // Resize master to exactly 1024x1024 if needed
      const master1024 = await resize(masterIcon, 1024, 1024, { fit: 'cover' });

      const generatedPaths: string[] = [];

      // Generate iOS icons
      if (platforms.includes('ios')) {
        const iosPaths = await generateIOSIcons(
          master1024,
          iconOutputDir,
          includeWatchOS,
          includeCarPlay
        );
        generatedPaths.push(...iosPaths);
      }

      // Generate Android icons
      if (platforms.includes('android')) {
        const androidPaths = await generateAndroidIcons(master1024, iconOutputDir);
        generatedPaths.push(...androidPaths);
      }

      return `✅ App icon generated successfully!\n\nGenerated ${generatedPaths.length} icon files:\n${generatedPaths.map(p => `  - ${p}`).join('\n')}\n\nMaster icon: 1024x1024`;
    } catch (error) {
      if (error instanceof Error) {
        return `❌ Failed to generate app icon: ${error.message}`;
      }
      return '❌ Failed to generate app icon: Unknown error';
    }
  },
});

/**
 * Generate iOS icon set with Contents.json
 */
async function generateIOSIcons(
  masterIcon: Buffer,
  baseOutputDir: string,
  includeWatchOS: boolean,
  includeCarPlay: boolean
): Promise<string[]> {
  const generatedPaths: string[] = [];

  // Create AppIcon.appiconset directory
  const appiconsetDir = path.join(baseOutputDir, 'ios', 'AppIcon.appiconset');
  await ensureDirectory(appiconsetDir);

  // Collect all iOS icon sizes
  let allIconSizes: IconSize[] = [...IOS_ICON_SIZES];

  if (includeWatchOS) {
    allIconSizes = allIconSizes.concat(WATCHOS_ICON_SIZES);
  }

  if (includeCarPlay) {
    allIconSizes = allIconSizes.concat(CARPLAY_ICON_SIZES);
  }

  // Generate each icon size
  for (const iconSize of allIconSizes) {
    const resizedIcon = await resize(masterIcon, iconSize.pixels, iconSize.pixels, {
      fit: 'cover',
    });

    const iconPath = path.join(appiconsetDir, iconSize.filename);
    await fs.writeFile(iconPath, resizedIcon);
    generatedPaths.push(iconPath);
  }

  // Generate Contents.json
  const contentsJson = generateContentsJson(allIconSizes);
  const contentsPath = path.join(appiconsetDir, 'Contents.json');
  await fs.writeFile(contentsPath, JSON.stringify(contentsJson, null, 2));
  generatedPaths.push(contentsPath);

  return generatedPaths;
}

/**
 * Generate Android icon set with adaptive icon XML
 */
async function generateAndroidIcons(
  masterIcon: Buffer,
  baseOutputDir: string
): Promise<string[]> {
  const generatedPaths: string[] = [];
  const androidDir = path.join(baseOutputDir, 'android');
  await ensureDirectory(androidDir);

  // Generate icons for each density
  for (const androidIcon of ANDROID_ICON_SIZES) {
    const densityDir = path.join(androidDir, androidIcon.directory);
    await ensureDirectory(densityDir);

    const resizedIcon = await resize(masterIcon, androidIcon.size, androidIcon.size, {
      fit: 'cover',
    });

    const iconPath = path.join(densityDir, androidIcon.filename);
    await fs.writeFile(iconPath, resizedIcon);
    generatedPaths.push(iconPath);
  }

  // Generate adaptive icon XML
  const adaptiveIconDir = path.join(androidDir, 'mipmap-anydpi-v26');
  await ensureDirectory(adaptiveIconDir);

  const adaptiveIconXml = generateAdaptiveIconXml();
  const xmlPath = path.join(adaptiveIconDir, 'ic_launcher.xml');
  await fs.writeFile(xmlPath, adaptiveIconXml);
  generatedPaths.push(xmlPath);

  // Note: For a complete adaptive icon setup, you would also generate separate
  // foreground and background layers. For now, we use the standard icon as both.
  // Users can customize by replacing ic_launcher_foreground and ic_launcher_background.

  return generatedPaths;
}
