# OpenCode Visual Toolkit

A comprehensive OpenCode plugin providing visual capabilities powered by Google Gemini AI:

- **Image Generation** (Nano Banana) - Create images from text prompts
- **Visual Analysis** - Analyze screenshots, compare designs, extract specs
- **Design-to-Code** - Convert mockups and sketches to code
- **App Assets** - Complete pipelines for iOS, Android, macOS, watchOS, and Web
- **Documentation Visuals** - Architecture diagrams, banners, social previews
- **Video Generation** - Text-to-video and image animation with Veo 2.0 (silent video)

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Tools Reference](#tools-reference)
  - [Core Image Tools](#core-image-tools)
  - [App Asset Tools](#app-asset-tools)
  - [Analysis Tools](#analysis-tools)
  - [Design-to-Code Tools](#design-to-code-tools)
  - [Documentation Tools](#documentation-tools)
  - [Video Tools](#video-tools)
- [Platform Support](#platform-support)
- [Examples](#examples)
- [Development](#development)
- [License](#license)

## Installation

### Prerequisites

- Node.js >= 18.0.0
- OpenCode CLI installed
- Google Gemini API key

### Install the Plugin

```bash
npm install opencode-visual-toolkit
```

Or add to your OpenCode configuration:

```json
{
  "plugins": ["opencode-visual-toolkit"]
}
```

## Quick Start

### 1. Set Your API Key

```bash
export GEMINI_API_KEY="your-api-key-here"
```

Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

### 2. Generate Your First Image

```bash
opencode "Generate a modern app icon with a gradient background"
```

The plugin will automatically use the `generate_image` tool and save the result to `./generated-assets/`

### 3. Create a Complete App Icon Set

```bash
opencode "Generate app icons for iOS and Android with a blue rocket ship on gradient background"
```

This creates:
- iOS: `AppIcon.appiconset/` with all 18+ sizes and `Contents.json`
- Android: `mipmap-*/` directories with adaptive icon layers

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini API key (required) | - |
| `OUTPUT_DIR` | Directory for generated assets | `./generated-assets` |

### Optional Configuration

Create `.env` file in your project root:

```env
GEMINI_API_KEY=your-api-key
OUTPUT_DIR=./assets
```

## Tools Reference

### Core Image Tools

#### `generate_image`

Create images from text prompts using Google Gemini.

**Parameters:**
- `prompt` (string, required) - Description of the image to generate
- `aspectRatio` (string, optional) - Aspect ratio: `'1:1'`, `'16:9'`, `'9:16'`, `'4:3'`, `'3:4'` (default: `'1:1'`)
- `count` (number, optional) - Number of images to generate (1-8, default: 1)
- `outputPath` (string, optional) - Custom output directory

**Example:**
```bash
opencode "generate a sunset over mountains in 16:9"
```

#### `edit_image`

Modify existing images with natural language instructions.

**Parameters:**
- `imagePath` (string, required) - Path to the source image
- `editPrompt` (string, required) - Instructions for editing
- `outputPath` (string, optional) - Custom output directory

**Example:**
```bash
opencode "edit ./photo.jpg to make it black and white"
```

#### `restore_image`

Enhance or repair damaged images.

**Parameters:**
- `imagePath` (string, required) - Path to the image to restore
- `instructions` (string, optional) - Specific restoration instructions (default: 'restore and enhance this image')
- `outputPath` (string, optional) - Custom output directory

**Example:**
```bash
opencode "restore ./old-photo.jpg"
```

---

### App Asset Tools

#### `generate_app_icon`

Generate complete app icon sets for multiple platforms from a single prompt.

**Parameters:**
- `prompt` (string, required) - Description of the icon design
- `platforms` (array, optional) - Platforms: `['ios', 'android', 'macos', 'watchos', 'web']` (default: `['ios', 'android']`)
- `includeWatchOS` (boolean, optional) - Include watchOS sizes (default: false)
- `includeCarPlay` (boolean, optional) - Include CarPlay sizes (default: false)
- `outputDir` (string, optional) - Custom output directory

**Example:**
```bash
opencode "generate app icons for all platforms with a purple chat bubble"
```

**Output Structure:**
```
generated-assets/app-icons/
├── ios/AppIcon.appiconset/
│   ├── Contents.json
│   ├── Icon-App-20x20@2x.png
│   ├── Icon-App-20x20@3x.png
│   └── ... (18+ sizes)
├── android/
│   ├── mipmap-mdpi/ic_launcher.png
│   ├── mipmap-hdpi/ic_launcher.png
│   ├── mipmap-xhdpi/ic_launcher.png
│   ├── mipmap-xxhdpi/ic_launcher.png
│   ├── mipmap-xxxhdpi/ic_launcher.png
│   └── mipmap-anydpi-v26/ic_launcher.xml
├── macos/AppIcon.iconset/
│   └── icon_*.png (10 sizes)
├── watchos/
│   └── Icon-*.png (31 sizes)
└── web/
    ├── favicon-*.png
    ├── apple-touch-icon.png
    └── icon-*.png (PWA)
```

#### `generate_app_screenshots`

Generate App Store screenshots for multiple device sizes.

**Parameters:**
- `source` (string, required) - Source image path or description
- `sourceType` (string, required) - `'image'` (resize existing) or `'code'` (generate from description)
- `platforms` (array, optional) - Platforms: `['ios', 'android']` (default: `['ios']`)
- `devices` (array, optional) - Specific devices (e.g., `['6.9-inch', 'iPad-12.9']`)
- `addDeviceFrame` (boolean, optional) - Add device frame (default: false)

**Example:**
```bash
opencode "generate iOS app screenshots showing a chat interface"
```

#### `resize_for_devices`

Smart image resizing to device dimensions with AI-guided cropping.

**Parameters:**
- `imagePath` (string, required) - Path to source image
- `platform` (string, optional) - `'ios'`, `'android'`, or `'both'` (default: `'both'`)
- `screenshotType` (string, optional) - `'phone'`, `'tablet'`, or `'all'` (default: `'all'`)
- `cropMode` (string, optional) - `'fit'` (letterbox), `'fill'` (crop), or `'smart'` (AI-guided, default)

**Example:**
```bash
opencode "resize ./app-screen.png for all iOS devices using smart crop"
```

**Crop Modes:**
- `fit`: Letterbox - maintains entire image with padding
- `fill`: Crop to fill - may cut off edges
- `smart`: AI analyzes important content and crops intelligently

#### `generate_device_mockup`

Place screenshots in realistic device frames for marketing materials.

**Parameters:**
- `imagePath` (string, required) - Path to screenshot
- `device` (string, required) - Device model (see supported devices below)
- `color` (string, optional) - Device color (e.g., 'silver', 'black', 'titanium')
- `orientation` (string, optional) - `'portrait'` or `'landscape'` (default: `'portrait'`)

**Supported Devices:**
- iPhone: `iphone-16-pro-max`, `iphone-16-pro`, `iphone-16-plus`, `iphone-16`, `iphone-15-pro-max`, `iphone-15-pro`, `iphone-15-plus`, `iphone-15`
- iPad: `ipad-pro-12.9`, `ipad-pro-11`, `ipad-air`, `ipad-mini`

**Example:**
```bash
opencode "create device mockup of ./screenshot.png on iPhone 16 Pro in titanium"
```

#### `generate_launch_images`

Generate splash screens for all device sizes.

**Parameters:**
- `design` (string, required) - Text description or path to image
- `platforms` (array, optional) - Platforms: `['ios', 'android']` (default: `['ios', 'android']`)
- `includeAllSizes` (boolean, optional) - Generate all device sizes (default: true)

**Example:**
```bash
opencode "generate launch images with company logo on gradient background"
```

---

### Analysis Tools

#### `analyze_screenshot`

Analyze UI screenshots for debugging and improvements.

**Parameters:**
- `imagePath` (string, required) - Path to screenshot
- `question` (string, optional) - Specific question about the UI

**Example:**
```bash
opencode "analyze ./app-screenshot.png for accessibility issues"
```

**Default Analysis Covers:**
- UI components and layout
- Visual consistency
- Accessibility concerns
- Potential bugs
- Improvement suggestions

#### `compare_screenshots`

Compare two screenshots for visual regression detection.

**Parameters:**
- `imagePath1` (string, required) - Path to first screenshot
- `imagePath2` (string, required) - Path to second screenshot
- `highlightDifferences` (boolean, optional) - Generate diff image (default: false)

**Example:**
```bash
opencode "compare ./before.png and ./after.png and highlight differences"
```

#### `analyze_mockup`

Extract design specifications from mockups.

**Parameters:**
- `imagePath` (string, required) - Path to design mockup
- `extractColors` (boolean, optional) - Extract color palette (default: true)
- `extractSpacing` (boolean, optional) - Extract spacing measurements (default: true)

**Example:**
```bash
opencode "analyze ./design-mockup.png and extract colors and spacing"
```

**Extracted Specs:**
- Component structure and hierarchy
- Typography (fonts, sizes, weights)
- Color palette (hex codes)
- Spacing and layout measurements (px/rem)

---

### Design-to-Code Tools

#### `mockup_to_code`

Convert design mockups to component code.

**Parameters:**
- `imagePath` (string, required) - Path to mockup
- `framework` (string, required) - `'react'`, `'vue'`, `'swiftui'`, or `'html'`
- `styling` (string, optional) - `'tailwind'`, `'css'`, or `'styled-components'` (default varies by framework)
- `componentName` (string, optional) - Custom component name

**Example:**
```bash
opencode "convert ./design.png to React with Tailwind CSS"
```

**Supported Frameworks:**
- **React**: TypeScript components with Tailwind or styled-components
- **Vue**: Composition API with scoped CSS
- **SwiftUI**: View protocol with native modifiers
- **HTML**: Semantic HTML5 with CSS or Tailwind

#### `sketch_to_code`

Convert hand-drawn sketches/wireframes to code.

**Parameters:**
- `imagePath` (string, required) - Path to sketch
- `framework` (string, required) - `'react'`, `'vue'`, `'swiftui'`, or `'html'`
- `styling` (string, optional) - Styling system (default varies by framework)
- `componentName` (string, optional) - Custom component name

**Example:**
```bash
opencode "convert my hand-drawn wireframe ./sketch.jpg to Vue components"
```

**Notes:**
- Interprets rough drawings as UI components
- Applies standard UI patterns for ambiguous elements
- Uses modern neutral color palettes

---

### Documentation Tools

#### `generate_architecture_diagram`

Generate architecture diagrams for documentation.

**Parameters:**
- `description` (string, required) - Architecture description
- `style` (string, optional) - `'boxes'` (simple), `'cloud'` (cloud architecture), or `'technical'` (detailed, default: `'boxes'`)
- `format` (string, optional) - `'png'`, `'svg'`, or `'mermaid'` (default: `'png'`)

**Example:**
```bash
opencode "generate architecture diagram for microservices with API gateway and databases"
```

**Styles:**
- `boxes`: Simple box diagrams with clear labels
- `cloud`: Cloud-native elements with service icons
- `technical`: Detailed with tech stacks, ports, protocols

#### `generate_sequence_diagram`

Generate sequence diagrams for interaction flows.

**Parameters:**
- `description` (string, required) - Interaction description
- `format` (string, optional) - `'png'` or `'mermaid'` (default: `'png'`)

**Example:**
```bash
opencode "generate sequence diagram for user authentication flow"
```

#### `generate_readme_banner`

Create professional README banners.

**Parameters:**
- `projectName` (string, required) - Project name
- `tagline` (string, optional) - Project tagline
- `style` (string, optional) - `'gradient'` (modern), `'minimal'` (clean), or `'tech'` (developer-focused, default: `'gradient'`)

**Example:**
```bash
opencode "generate README banner for 'My Project' with tagline 'Build amazing things'"
```

**Output:**
- 1280x640 PNG banner
- Markdown snippet for README.md

#### `generate_social_preview`

Generate Open Graph images for social sharing.

**Parameters:**
- `projectName` (string, required) - Project name
- `description` (string, optional) - Project description
- `style` (string, optional) - `'gradient'`, `'minimal'`, or `'bold'` (default: `'gradient'`)

**Example:**
```bash
opencode "generate social preview for 'My App' - The best productivity tool"
```

**Output:**
- 1200x630 PNG image
- HTML meta tags for Open Graph integration

---

### Video Tools

> **⚠️ Important:** Videos are generated **without sound**. Veo 2.0 produces silent video only. If you need audio, you'll need to add it separately using video editing software.

> **Note:** Video generation is a long-running async operation that typically takes 30-90 seconds to complete.

#### `generate_video`

Generate videos from text prompts using Veo 2.0.

**Parameters:**
- `prompt` (string, required) - Video description
- `aspectRatio` (string, optional) - Aspect ratio: `'16:9'`, `'9:16'`, `'1:1'` (default: `'16:9'`)

**Example:**
```bash
opencode "generate a video of a drone flying over a city at sunset"
```

**Output:**
- MP4 video file (no audio)
- Typically 5-8 seconds duration
- Generation time: 30-90 seconds

#### `image_to_video`

Animate static images into videos.

**Parameters:**
- `imagePath` (string, required) - Path to image
- `motion` (string, optional) - Motion description (default: 'add subtle natural movement and animation')
- `aspectRatio` (string, optional) - Aspect ratio (default: `'16:9'`)

**Example:**
```bash
opencode "animate ./landscape.jpg with slow camera pan"
```

**Output:**
- MP4 video file (no audio)
- Maintains original image content with added motion

---

## Platform Support

### iOS
- **18+ icon sizes** for iPhone, iPad, App Store
- **Screenshot sizes** for all devices (6.9", 6.7", 6.3", 6.1", 5.5" + iPads)
- **watchOS** support (31 sizes for all watch models)
- **CarPlay** support
- Generates `Contents.json` for Xcode asset catalogs

### Android
- **5 density buckets** (mdpi through xxxhdpi)
- **Adaptive icons** (foreground + background layers)
- **Screenshot sizes** for phones and tablets (16:9, 18:9, 19:9, 20:9)
- Generates XML configuration files

### macOS
- **10 icon sizes** (16-512px at 1x and 2x)
- `.iconset` folder structure
- Ready for `iconutil` conversion to `.icns`

### watchOS
- **31 icon sizes** for all watch models (38mm-49mm + Ultra)
- Contexts: notification, home screen, short look, App Store
- Generates `Contents.json` with role and subtype fields

### Web
- **Favicon** (16, 32, 48px)
- **Apple touch icon** (180px)
- **PWA icons** (192, 512px)
- Generates `manifest.json` with icon definitions

## Examples

### Complete App Launch Pipeline

Generate all assets needed to launch an iOS/Android app:

```bash
# 1. Generate app icons
opencode "generate app icons for iOS and Android - blue gradient with white rocket"

# 2. Create App Store screenshots
opencode "generate iOS screenshots showing the main dashboard, profile screen, and settings"

# 3. Create device mockups for marketing
opencode "create iPhone 16 Pro mockup of ./screenshot-1.png in titanium"

# 4. Generate launch images
opencode "generate launch images with company logo and tagline"
```

### Design-to-Code Workflow

Convert a design mockup to working code:

```bash
# 1. Analyze the design
opencode "analyze ./mockup.png and extract colors and spacing"

# 2. Convert to code
opencode "convert ./mockup.png to React with Tailwind CSS"

# 3. Compare with implementation
opencode "compare ./mockup.png with ./screenshot.png"
```

### Documentation Enhancement

Create professional documentation visuals:

```bash
# 1. Generate README banner
opencode "generate README banner for 'Visual Toolkit' - AI-powered design tools"

# 2. Create architecture diagram
opencode "generate architecture diagram showing plugin system with Gemini API integration"

# 3. Generate social preview
opencode "generate social preview for 'Visual Toolkit' - Create stunning visuals with AI"
```

### Responsive Design Testing

Test designs across all devices:

```bash
# 1. Resize for all devices
opencode "resize ./design.png for all devices using smart crop"

# 2. Generate mockups for each platform
opencode "create iPhone 15 Pro Max mockup of ./resized/ios/6.9-inch/design.png"
opencode "create iPad Pro 12.9 mockup of ./resized/ios/iPad-12.9/design.png"
```

## Development

### Setup

```bash
# Clone repository
git clone https://github.com/48Nauts-Operator/opencode-nanobanana.git
cd opencode-visual-toolkit

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Add your GEMINI_API_KEY to .env
```

### Build

```bash
# Build for production
npm run build

# Watch mode for development
npm run dev
```

### Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Type checking
npm run typecheck

# Lint
npm run lint
```

### Project Structure

```
opencode-visual-toolkit/
├── src/
│   ├── index.ts              # Plugin entry point
│   ├── providers/
│   │   └── gemini.ts         # Gemini API client
│   ├── tools/
│   │   ├── core/             # Core image tools
│   │   ├── app-assets/       # App asset tools
│   │   ├── analyze/          # Analysis tools
│   │   ├── design/           # Design-to-code tools
│   │   ├── docs/             # Documentation tools
│   │   └── video/            # Video tools
│   ├── platforms/            # Platform specifications
│   │   ├── ios.ts
│   │   ├── android.ts
│   │   ├── macos.ts
│   │   ├── watchos.ts
│   │   └── web.ts
│   └── utils/                # Utilities
│       ├── file-handler.ts
│       └── image-processing.ts
├── tests/                    # Test files
├── templates/                # Asset templates
├── dist/                     # Build output
├── package.json
├── tsconfig.json
└── README.md
```

## API Rate Limits

Google Gemini API has rate limits:
- **Free tier**: 60 requests per minute
- **Paid tier**: Higher limits available

For batch operations (generating many icons/screenshots), the plugin automatically handles:
- Rate limiting with exponential backoff
- Batch processing to minimize API calls
- Caching to avoid duplicate requests

## Troubleshooting

### API Key Issues

```bash
# Verify API key is set
echo $GEMINI_API_KEY

# Test with a simple request
opencode "generate a test image of a red circle"
```

### Image Quality

For best results:
- Use detailed, specific prompts
- Specify aspect ratios that match your use case
- For app icons, always start with 1024x1024 and downscale

### Platform-Specific Issues

**iOS:**
- Ensure `Contents.json` is valid by opening in Xcode
- Check icon filenames match Contents.json references

**Android:**
- Verify XML files are well-formed
- Test adaptive icons on Android 8.0+ devices

**macOS:**
- Run `iconutil -c icns AppIcon.iconset` to create final `.icns`

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run `npm test` and `npm run typecheck`
6. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details

## Acknowledgments

- Powered by [Google Gemini AI](https://deepmind.google/technologies/gemini/)
- Video generation by [Veo 2.0](https://deepmind.google/technologies/veo/)
- Built for [OpenCode](https://opencode.ai/)
- Image processing by [Sharp](https://sharp.pixelplumbing.com/)

## Support

- Documentation: [GitHub Wiki](https://github.com/48Nauts-Operator/opencode-nanobanana/wiki)
- Issues: [GitHub Issues](https://github.com/48Nauts-Operator/opencode-nanobanana/issues)
- Discussions: [GitHub Discussions](https://github.com/48Nauts-Operator/opencode-nanobanana/discussions)

---

Made with ❤️ by [48Nauts-Operator](https://github.com/48Nauts-Operator)
