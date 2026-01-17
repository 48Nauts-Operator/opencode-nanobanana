/**
 * OpenCode Visual Toolkit
 *
 * A comprehensive plugin providing visual capabilities:
 * - Image generation (Nano Banana)
 * - Visual analysis
 * - Design-to-code
 * - App asset pipelines (iOS, Android, macOS, Web)
 */

// WORKAROUND for OpenCode v1.1.23 plugin loader bug:
// OpenCode v1.1.23's plugin loader incorrectly tries to call ALL exported
// functions during plugin loading, causing errors. We can only export the
// plugin default export until this is fixed upstream.
// See: https://github.com/anomalyco/opencode/issues/[ISSUE_NUMBER]
//
// Original exports (for programmatic API usage - currently disabled):
// export * from './providers/gemini.js';
// export * from './utils/file-handler.js';
// export * from './utils/image-processing.js';
// export * from './utils/ffmpeg.js';
// export * from './tools/video/generate-video.js';
// export * from './tools/video/image-to-video.js';
// export * from './tools/video/storyboard-video.js';
// export * from './tools/video/extend-video.js';

// Only export plugin for OpenCode
export { default } from './plugin.js';
