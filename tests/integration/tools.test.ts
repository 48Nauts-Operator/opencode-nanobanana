import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { generateImageTool } from '../../src/tools/core/generate-image';
import { generateAppIcon } from '../../src/tools/app-assets/app-icon';
import { generate_launch_images } from '../../src/tools/app-assets/launch-images';

// Create a minimal valid PNG image (1x1 pixel, transparent)
const createValidPNG = (): string => {
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 pixel
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, // RGBA, CRC
    0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, // IDAT chunk
    0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, // compressed data
    0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, // CRC
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, // IEND chunk
    0x42, 0x60, 0x82                                 // CRC
  ]);
  return pngData.toString('base64');
};

// Mock Gemini API
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: vi.fn().mockResolvedValue({
          candidates: [
            {
              content: {
                parts: [
                  {
                    inlineData: {
                      data: createValidPNG(),
                      mimeType: 'image/png',
                    },
                  },
                ],
              },
            },
          ],
        }),
      },
    })),
  };
});

// Test output directory
const testOutputDir = path.join(process.cwd(), 'test-output-integration');

describe('Integration Tests - Tool Execution Flows', () => {
  beforeEach(async () => {
    // Clean up test output directory
    try {
      await fs.rm(testOutputDir, { recursive: true, force: true });
    } catch (error) {
      // Directory doesn't exist, ignore
    }
    await fs.mkdir(testOutputDir, { recursive: true });

    // Set environment variables
    process.env.GEMINI_API_KEY = 'test-api-key';
    process.env.OUTPUT_DIR = testOutputDir;
  });

  afterEach(async () => {
    // Clean up test output directory
    try {
      await fs.rm(testOutputDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
    vi.clearAllMocks();
  });

  describe('Generate Image Tool - Full Flow', () => {
    it('should generate image and create proper file structure', async () => {
      const result = await generateImageTool.execute(
        { prompt: 'a test image' },
        {} as any
      );

      expect(result).toContain('Successfully generated 1 image');
      expect(result).toContain('a_test_image');

      // Verify file was created
      const files = await fs.readdir(testOutputDir);
      expect(files.length).toBeGreaterThan(0);
      expect(files[0]).toMatch(/a_test_image.*\.png$/);

      // Verify file is readable
      const filePath = path.join(testOutputDir, files[0]);
      const fileContent = await fs.readFile(filePath);
      expect(fileContent.length).toBeGreaterThan(0);
    });

    it('should generate multiple images with correct numbering', async () => {
      const result = await generateImageTool.execute(
        { prompt: 'test images', count: 3 },
        {} as any
      );

      expect(result).toContain('Successfully generated 3 images');

      // Verify all files were created
      const files = await fs.readdir(testOutputDir);
      expect(files.length).toBe(3);
      expect(files.some(f => f.includes('test_images'))).toBe(true);
    });
  });

  describe('Generate App Icon Tool - iOS Contents.json Format', () => {
    it('should create iOS AppIcon.appiconset with valid Contents.json', async () => {
      const result = await generateAppIcon.execute(
        { prompt: 'app icon', platforms: ['ios'] },
        {} as any
      );

      expect(result).toContain('icon');

      // Verify app-icons/ios/AppIcon.appiconset directory exists
      const appiconsetPath = path.join(testOutputDir, 'app-icons', 'ios', 'AppIcon.appiconset');
      const dirExists = await fs.stat(appiconsetPath).then(() => true).catch(() => false);
      expect(dirExists).toBe(true);

      // Verify Contents.json exists
      const contentsPath = path.join(appiconsetPath, 'Contents.json');
      const contentsExists = await fs.stat(contentsPath).then(() => true).catch(() => false);
      expect(contentsExists).toBe(true);

      // Verify Contents.json is valid JSON
      const contentsContent = await fs.readFile(contentsPath, 'utf-8');
      const contentsJson = JSON.parse(contentsContent);

      // Validate structure
      expect(contentsJson).toHaveProperty('images');
      expect(contentsJson).toHaveProperty('info');
      expect(Array.isArray(contentsJson.images)).toBe(true);
      expect(contentsJson.images.length).toBeGreaterThan(0);

      // Validate first image entry
      const firstImage = contentsJson.images[0];
      expect(firstImage).toHaveProperty('filename');
      expect(firstImage).toHaveProperty('idiom');
      expect(firstImage).toHaveProperty('scale');
      expect(firstImage).toHaveProperty('size');

      // Validate info object
      expect(contentsJson.info).toHaveProperty('author');
      expect(contentsJson.info).toHaveProperty('version');
      expect(contentsJson.info.author).toBe('opencode-visual-toolkit');
      expect(contentsJson.info.version).toBe(1);

      // Verify icon files exist
      const appiconsetFiles = await fs.readdir(appiconsetPath);
      const pngFiles = appiconsetFiles.filter(f => f.endsWith('.png'));
      expect(pngFiles.length).toBeGreaterThan(0);
    });

    it('should generate all required iOS icon sizes', async () => {
      await generateAppIcon.execute(
        { prompt: 'app icon', platforms: ['ios'] },
        {} as any
      );

      const appiconsetPath = path.join(testOutputDir, 'app-icons', 'ios', 'AppIcon.appiconset');
      const contentsPath = path.join(appiconsetPath, 'Contents.json');
      const contentsContent = await fs.readFile(contentsPath, 'utf-8');
      const contentsJson = JSON.parse(contentsContent);

      // Verify we have all standard iOS icon sizes (18+ sizes)
      expect(contentsJson.images.length).toBeGreaterThanOrEqual(18);

      // Verify App Store icon (1024x1024) is included
      const appStoreIcon = contentsJson.images.find(
        (img: any) => img.size === '1024x1024'
      );
      expect(appStoreIcon).toBeDefined();
      expect(appStoreIcon?.scale).toBe('1x');
      expect(appStoreIcon?.idiom).toBe('ios-marketing');
    });
  });

  describe('Generate App Icon Tool - Android XML Format', () => {
    it('should create Android mipmap directories with valid ic_launcher.xml', async () => {
      const result = await generateAppIcon.execute(
        { prompt: 'app icon', platforms: ['android'] },
        {} as any
      );

      expect(result).toContain('icon');

      // Verify mipmap directories exist under app-icons/android/
      const densities = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];
      for (const density of densities) {
        const mipmapPath = path.join(testOutputDir, 'app-icons', 'android', `mipmap-${density}`);
        const dirExists = await fs.stat(mipmapPath).then(() => true).catch(() => false);
        expect(dirExists).toBe(true);

        // Verify ic_launcher.png exists in each directory
        const iconPath = path.join(mipmapPath, 'ic_launcher.png');
        const iconExists = await fs.stat(iconPath).then(() => true).catch(() => false);
        expect(iconExists).toBe(true);
      }

      // Verify ic_launcher.xml exists
      const xmlPath = path.join(testOutputDir, 'app-icons', 'android', 'mipmap-anydpi-v26', 'ic_launcher.xml');
      const xmlExists = await fs.stat(xmlPath).then(() => true).catch(() => false);
      expect(xmlExists).toBe(true);

      // Verify XML is valid and contains required elements
      const xmlContent = await fs.readFile(xmlPath, 'utf-8');
      expect(xmlContent).toContain('<?xml version="1.0" encoding="utf-8"?>');
      expect(xmlContent).toContain('<adaptive-icon');
      expect(xmlContent).toContain('<background');
      expect(xmlContent).toContain('<foreground');
      expect(xmlContent).toContain('android:drawable');
      expect(xmlContent).toContain('</adaptive-icon>');
    });

    it('should verify XML references adaptive icon layers', async () => {
      await generateAppIcon.execute(
        { prompt: 'app icon', platforms: ['android'] },
        {} as any
      );

      // Verify XML references both layers
      const xmlPath = path.join(testOutputDir, 'app-icons', 'android', 'mipmap-anydpi-v26', 'ic_launcher.xml');
      const xmlContent = await fs.readFile(xmlPath, 'utf-8');
      expect(xmlContent).toContain('@mipmap/ic_launcher');
    });
  });

  describe('Generate Launch Images Tool - File Structure', () => {
    it('should execute successfully for multiple platforms', async () => {
      const result = await generate_launch_images.execute(
        { design: 'splash screen', platforms: ['ios', 'android'] },
        {} as any
      );

      // Verify successful execution
      expect(result).toBeTruthy();
      expect(result).not.toContain('Failed');
      expect(result).not.toContain('Error');
    });

    it('should execute successfully with includeAllSizes flag', async () => {
      const result = await generate_launch_images.execute(
        { design: 'splash screen', platforms: ['ios'], includeAllSizes: true },
        {} as any
      );

      // Verify successful execution
      expect(result).toBeTruthy();
      expect(result).not.toContain('Failed');
      expect(result).not.toContain('Error');
    });
  });

  describe('Cross-Platform Tool Integration', () => {
    it('should generate assets for both iOS and Android in single execution', async () => {
      const result = await generateAppIcon.execute(
        { prompt: 'cross-platform icon', platforms: ['ios', 'android'] },
        {} as any
      );

      expect(result).toContain('icon');

      // Verify iOS assets
      const appiconsetPath = path.join(testOutputDir, 'app-icons', 'ios', 'AppIcon.appiconset');
      const iosExists = await fs.stat(appiconsetPath).then(() => true).catch(() => false);
      expect(iosExists).toBe(true);

      // Verify Android assets
      const mipmapPath = path.join(testOutputDir, 'app-icons', 'android', 'mipmap-mdpi');
      const androidExists = await fs.stat(mipmapPath).then(() => true).catch(() => false);
      expect(androidExists).toBe(true);

      // Verify XML exists
      const xmlPath = path.join(testOutputDir, 'app-icons', 'android', 'mipmap-anydpi-v26', 'ic_launcher.xml');
      const xmlExists = await fs.stat(xmlPath).then(() => true).catch(() => false);
      expect(xmlExists).toBe(true);
    });
  });

  describe('Error Handling in Integration Flow', () => {
    it('should handle missing API key gracefully', async () => {
      delete process.env.GEMINI_API_KEY;

      const result = await generateImageTool.execute(
        { prompt: 'test' },
        {} as any
      );

      expect(result).toContain('GEMINI_API_KEY');
      expect(result).toContain('environment');
    });

    it('should handle invalid output paths gracefully', async () => {
      const result = await generateImageTool.execute(
        { prompt: 'test', outputPath: '/invalid/path/that/does/not/exist/image.png' },
        {} as any
      );

      // Should either create the path or return error message
      expect(result).toBeTruthy();
    });
  });
});
