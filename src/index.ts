/**
 * OpenCode Visual Toolkit Plugin
 *
 * A comprehensive OpenCode plugin providing visual capabilities:
 * - Image generation (Nano Banana)
 * - Visual analysis
 * - Design-to-code conversion
 * - Documentation visuals
 * - Video generation
 * - Complete app asset pipelines for iOS, Android, macOS, watchOS, and Web
 */

import type { Plugin } from '@opencode-ai/plugin';

// Core image tools
import { generateImageTool } from './tools/core/generate-image.js';
import { editImageTool } from './tools/core/edit-image.js';
import { restoreImageTool } from './tools/core/restore-image.js';

// App asset tools
import { generateAppIcon } from './tools/app-assets/app-icon.js';
import { generateScreenshotsTool } from './tools/app-assets/screenshots.js';
import { resizeForDevicesTool } from './tools/app-assets/resize-devices.js';
import { generateDeviceMockup } from './tools/app-assets/device-mockup.js';
import { generate_launch_images } from './tools/app-assets/launch-images.js';

// Analysis tools
import { analyzeScreenshotTool } from './tools/analyze/screenshot.js';
import { compareScreenshotsTool } from './tools/analyze/compare.js';
import { analyzeMockupTool } from './tools/analyze/mockup.js';

// Design-to-code tools
import { mockupToCodeTool } from './tools/design/mockup-to-code.js';
import { sketchToCodeTool } from './tools/design/sketch-to-code.js';

// Documentation tools
import { generateArchitectureDiagramTool } from './tools/docs/architecture-diagram.js';
import { generateSequenceDiagramTool } from './tools/docs/sequence-diagram.js';
import { generateReadmeBannerTool } from './tools/docs/readme-banner.js';
import { generateSocialPreview } from './tools/docs/social-preview.js';

// Video tools
import { generateVideoTool } from './tools/video/generate-video.js';
import { imageToVideoTool } from './tools/video/image-to-video.js';

/**
 * Visual Toolkit Plugin
 *
 * Registers all visual tools with OpenCode
 */
const VisualToolkitPlugin: Plugin = async (_ctx) => {
  try {
    // Log startup message
    console.log('🎨 Visual Toolkit Plugin initializing...');

    // Verify environment setup
    const hasGeminiKey = !!process.env.GEMINI_API_KEY;

    if (!hasGeminiKey) {
      console.warn('⚠️  GEMINI_API_KEY not found in environment. Image/video generation tools will not work.');
      console.warn('   Set GEMINI_API_KEY to enable all features.');
    }

    console.log('✅ Visual Toolkit Plugin initialized successfully');
    console.log('📦 Registered 19 tools across 6 categories:');
    console.log('   - Core: 3 tools (generate, edit, restore images)');
    console.log('   - App Assets: 5 tools (icons, screenshots, mockups, launch images)');
    console.log('   - Analysis: 3 tools (screenshot, compare, mockup)');
    console.log('   - Design-to-Code: 2 tools (mockup, sketch)');
    console.log('   - Documentation: 4 tools (architecture, sequence, banner, social)');
    console.log('   - Video: 2 tools (generate, image-to-video)');

    return {
      tool: {
        // Core image tools
        generate_image: generateImageTool,
        edit_image: editImageTool,
        restore_image: restoreImageTool,

        // App asset tools
        generate_app_icon: generateAppIcon,
        generate_app_screenshots: generateScreenshotsTool,
        resize_for_devices: resizeForDevicesTool,
        generate_device_mockup: generateDeviceMockup,
        generate_launch_images: generate_launch_images,

        // Analysis tools
        analyze_screenshot: analyzeScreenshotTool,
        compare_screenshots: compareScreenshotsTool,
        analyze_mockup: analyzeMockupTool,

        // Design-to-code tools
        mockup_to_code: mockupToCodeTool,
        sketch_to_code: sketchToCodeTool,

        // Documentation tools
        generate_architecture_diagram: generateArchitectureDiagramTool,
        generate_sequence_diagram: generateSequenceDiagramTool,
        generate_readme_banner: generateReadmeBannerTool,
        generate_social_preview: generateSocialPreview,

        // Video tools
        generate_video: generateVideoTool,
        image_to_video: imageToVideoTool,
      },
    };
  } catch (error) {
    console.error('❌ Visual Toolkit Plugin initialization failed:', error);
    throw new Error(`Failed to initialize Visual Toolkit Plugin: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export default VisualToolkitPlugin;
