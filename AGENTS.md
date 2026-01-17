# AGENTS.md - OpenCode Nanobanana Plugin

Guidelines for AI agents working in this repository.

## Project Overview

OpenCode plugin providing visual AI capabilities via Google Gemini:
- **Image Generation** - Nano Banana (gemini-2.5-flash-image) - FREE
- **Image Analysis** - Gemini 2.0 Flash for vision tasks
- **Video Generation** - Veo 3.0 for text-to-video
- **Storyboard Videos** - Multi-scene with FFmpeg stitching

## Build Commands

```bash
# Type check (run before committing)
npm run typecheck

# Build TypeScript to dist/
npm run build

# Watch mode for development
npm run dev

# Clean build artifacts
npm run clean
```

## Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run single test file
npx vitest run tests/video/storyboard.test.ts

# Run tests matching pattern
npx vitest run -t "scene generation"
```

## Code Style Guidelines

### TypeScript Configuration
- **Target**: ES2022, NodeNext modules
- **Strict mode**: Enabled with all strict checks
- `noUncheckedIndexedAccess`: true - always check array/object access
- `noUnusedLocals` / `noUnusedParameters`: true - no dead code

### Imports
```typescript
// External packages first
import { GoogleGenAI } from '@google/genai';

// Node built-ins with node: prefix NOT required (ES modules)
import { writeFile } from 'fs/promises';
import { join } from 'path';

// Internal imports with .js extension (required for NodeNext)
import { GeminiProvider } from '../../providers/gemini.js';
import { saveImage, loadImage } from '../../utils/file-handler.js';
```

### Naming Conventions
```typescript
// Interfaces: PascalCase with descriptive names
interface VideoGenerationOptions { }
interface ImageGenerationResult { }

// Classes: PascalCase
class GeminiProvider { }

// Functions: camelCase, verb-first
async function generateVideo() { }
async function saveImage() { }

// Constants: SCREAMING_SNAKE_CASE for model names
private readonly VEO_MODEL = 'veo-3.0-generate-001';
private readonly NANO_BANANA_MODEL = 'gemini-2.5-flash-image';

// Tool names: snake_case (OpenCode convention)
generate_image, edit_image, analyze_screenshot
```

### Type Definitions
```typescript
// Use explicit return types
async function generateVideo(options: GenerateVideoOptions): Promise<GenerateVideoResult>

// Use union types for constrained values
aspectRatio?: '16:9' | '9:16';
duration?: 4 | 6 | 8;

// Export interfaces alongside functions
export interface GenerateVideoOptions { }
export async function generateVideo() { }
```

### Error Handling
```typescript
// Always catch and provide context
try {
  const result = await provider.generateImage(prompt);
} catch (error: unknown) {
  const err = error as Error;
  return JSON.stringify({
    success: false,
    error: err?.message || String(error),
    help: 'Check your GEMINI_API_KEY environment variable.'
  });
}

// Check for specific error conditions
if (error instanceof Error && error.message.includes('API key')) {
  return '✗ Error: GEMINI_API_KEY not set';
}
```

### Tool Return Format
Tools must return JSON strings:
```typescript
// Success
return JSON.stringify({
  success: true,
  imagePath: outputPath,
  generationTime: `${(time / 1000).toFixed(1)}s`
});

// Failure
return JSON.stringify({
  success: false,
  error: errorMessage,
  help: 'Helpful recovery instructions'
});
```

## Architecture

```
src/
├── index.ts          # Entry point (only exports plugin default)
├── plugin.ts         # All 16 tools defined inline
├── providers/
│   └── gemini.ts     # GeminiProvider class (all AI calls)
├── tools/
│   ├── analyze/      # Screenshot analysis tools
│   ├── app-assets/   # iOS/Android asset generators
│   ├── core/         # Image gen/edit/restore
│   ├── design/       # Mockup/sketch to code
│   ├── docs/         # Diagrams, banners
│   └── video/        # Veo 3 video tools
├── platforms/        # Platform-specific asset specs
└── utils/
    ├── file-handler.ts
    ├── image-processing.ts
    └── ffmpeg.ts
```

## Critical: Plugin Export Restriction

**OpenCode v1.1.23+ has a bug** that crashes if anything other than the default plugin is exported.

```typescript
// src/index.ts - ONLY this export works
export { default } from './plugin.js';

// DO NOT export classes or utilities:
// export * from './providers/gemini.js';  // CRASHES OpenCode
```

All tools must be defined inline in `plugin.ts`, not imported from tool files.

## Tools and Models Reference

### All 16 Tools

| # | Tool Name | Category | Model Used | Description |
|---|-----------|----------|------------|-------------|
| 1 | `generate_image` | Core | `gemini-2.5-flash-image` | Generate images from text (FREE) |
| 2 | `edit_image` | Core | `gemini-2.5-flash-image` | Edit images with natural language |
| 3 | `restore_image` | Core | `gemini-2.5-flash-image` | Restore/enhance damaged images |
| 4 | `analyze_screenshot` | Analysis | `gemini-2.0-flash` | Debug UI screenshots |
| 5 | `compare_screenshots` | Analysis | `gemini-2.0-flash` | Visual regression testing |
| 6 | `analyze_mockup` | Analysis | `gemini-2.0-flash` | Extract design specs |
| 7 | `mockup_to_code` | Design | `gemini-2.0-flash` | Convert mockups to React/Vue/SwiftUI/HTML |
| 8 | `sketch_to_code` | Design | `gemini-2.0-flash` | Convert sketches to code |
| 9 | `generate_architecture_diagram` | Docs | `gemini-2.5-flash-image` | Create architecture diagrams |
| 10 | `generate_sequence_diagram` | Docs | `gemini-2.5-flash-image` | Create sequence diagrams |
| 11 | `generate_readme_banner` | Docs | `gemini-2.5-flash-image` | GitHub README banners |
| 12 | `generate_social_preview` | Docs | `gemini-2.5-flash-image` | Open Graph images |
| 13 | `generate_video` | Video | `veo-3.0-generate-001` | Text to video (with audio) |
| 14 | `image_to_video` | Video | `veo-3.0-generate-001` | Animate static images |
| 15 | `generate_storyboard_video` | Video | `veo-3.0-generate-001` / `veo-3.1-generate-preview` | Multi-scene videos |
| 16 | `extend_video` | Video | `veo-3.0-generate-001` | Extend existing videos |

### Model Summary

| Model | Purpose | Cost | Notes |
|-------|---------|------|-------|
| `gemini-2.5-flash-image` | Image generation/editing | FREE | Nano Banana |
| `gemini-2.0-flash` | Vision/analysis | FREE | Multimodal understanding |
| `veo-3.0-generate-001` | Video generation | PAID | Has native audio |
| `veo-3.1-generate-preview` | Video with references | PAID | Character consistency |

**Model names change frequently** - verify at https://ai.google.dev/models

## Testing the Plugin

```bash
# Quick load test
node -e "
import('./dist/index.js').then(async (m) => {
  const r = await m.default({});
  console.log('Tools:', Object.keys(r.tool).length);
}).catch(e => console.error(e));
"

# Test specific tool
node -e "
const p = require('./dist/index.js').default;
p({}).then(r => r.tool.generate_image.execute({
  prompt: 'A cat',
  aspectRatio: '1:1'
}, {})).then(console.log);
"
```

## Environment Variables

```bash
GEMINI_API_KEY=your-api-key  # Required for all AI operations
OUTPUT_DIR=./generated-assets # Optional, defaults to ./generated-assets
```

## Common Issues

1. **"Image generation not available in your country"** - Google changed model names. Check current model at https://ai.google.dev/models

2. **OpenCode crashes on startup** - Remove plugin from `~/.opencode/package.json`, check for illegal exports in `src/index.ts`

3. **EISDIR error** - `outputPath` should be a directory, not a file path

4. **Type errors with array access** - Use `images[0]` with null check due to `noUncheckedIndexedAccess`

## SDK Version Management (CRITICAL)

**Always keep SDK version aligned with OpenCode runtime:**

```bash
# Check current versions
cat ~/.opencode/package.json           # Global OpenCode SDK
cat /path/to/project/.opencode/package.json  # Local override (if exists)

# Update plugin SDK to match
npm install @opencode-ai/plugin@<version>
npm run build
```

**Version Mismatch Symptoms:**
- `TypeError: Cannot call a class constructor without |new|`
- Plugin loads but tools don't work
- OpenCode crashes on startup

**Recovery:**
```bash
# If plugin breaks OpenCode, remove it from config:
# Edit ~/.opencode/package.json, remove opencode-nanobanana line
# Then restart OpenCode
```

## Gemini API Reference

### Image Generation (Nano Banana)
```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash-image',
  contents: prompt,
  config: {
    responseModalities: ['image', 'text'],
  },
});
```

**Supported Aspect Ratios:** `1:1`, `16:9`, `9:16`, `4:3`, `3:4`

### Image Analysis (Vision)
```typescript
const result = await ai.models.generateContent({
  model: 'gemini-2.0-flash',
  contents: [{
    parts: [
      { inlineData: { data: base64Image, mimeType: 'image/png' } },
      { text: question }
    ]
  }]
});
```

### Video Generation (Veo 3)
```typescript
let operation = await ai.models.generateVideos({
  model: 'veo-3.0-generate-001',
  prompt,
  config: {
    numberOfVideos: 1,
    aspectRatio: '16:9',
    resolution: '720p',
    durationSeconds: 8,
  },
});

// Poll until done
while (!operation.done) {
  await sleep(10000);
  operation = await ai.operations.getVideosOperation({ operation });
}
```

## Project Documentation

Full documentation in Obsidian:
`/Users/jarvis/Knowledge/Obsidian/Business/NautCoder/Development/Tools/opencode-nanobanana/`

| Folder | Contents |
|--------|----------|
| `00-Ideation/` | Product vision and goals |
| `01-Research/` | Nano Banana API, iOS/Android asset specs |
| `02-Planning/` | PRD, task breakdown |
| `03-Blueprint/` | Technical architecture |
| `04-Implementation/` | Progress tracker, error logs, recovery guides |
| `05-User-Docs/` | Usage guide |

## iOS App Icon Sizes (Reference)

For `generate_app_icon` tool implementation:

| Size (pt) | Scale | Pixels | Usage |
|-----------|-------|--------|-------|
| 20 | @2x | 40x40 | iPhone Notification |
| 20 | @3x | 60x60 | iPhone Notification |
| 29 | @2x | 58x58 | iPhone Settings |
| 29 | @3x | 87x87 | iPhone Settings |
| 40 | @2x | 80x80 | iPhone Spotlight |
| 40 | @3x | 120x120 | iPhone Spotlight |
| 60 | @2x | 120x120 | iPhone App |
| 60 | @3x | 180x180 | iPhone App |
| 1024 | @1x | 1024x1024 | App Store |

**Strategy:** Generate 1024x1024 master, downscale to all sizes (never upscale)

## Android Adaptive Icons (Reference)

| Density | Pixels |
|---------|--------|
| mdpi | 48x48 |
| hdpi | 72x72 |
| xhdpi | 96x96 |
| xxhdpi | 144x144 |
| xxxhdpi | 192x192 |

**Adaptive Icon Structure:** Foreground (safe zone aware) + Background layer
