# Plugin Verification Guide

## How to Verify OpenCode Visual Toolkit Has Loaded

### ✅ Plugin Is Now Installed

The plugin is installed at:
- **Location**: `~/.config/opencode/node_modules/opencode-visual-toolkit/`
- **Type**: Symlinked (any changes to source will reflect immediately)
- **Status**: ✓ Installed successfully

### Method 1: Check Package.json (Quickest)

```bash
cat ~/.config/opencode/package.json
```

You should see:
```json
{
  "dependencies": {
    "opencode-visual-toolkit": "file:///Volumes/DevHub_ext/factory/toolbox/opencode-nanobanana"
  }
}
```

### Method 2: Run the Test Script

```bash
cd /Volumes/DevHub_ext/factory/toolbox/opencode-nanobanana
node test-plugin-load.js
```

Expected output:
```
✅ Plugin loaded successfully!
✓ Plugin has 19 tools registered:
  • generate_image
  • edit_image
  • restore_image
  • generate_app_icon
  ... (and 15 more)
```

### Method 3: Check Symlink

```bash
ls -la ~/.config/opencode/node_modules/ | grep visual
```

Should show:
```
drwxr-xr-x@ 30 jarvis  staff  960 Jan 15 17:47 opencode-visual-toolkit
```

### Method 4: Use OpenCode Desktop (Final Verification)

1. **Restart OpenCode Desktop app** (Important!)
2. **Start a conversation**
3. **Try one of these prompts**:
   - "Generate a modern app icon with a gradient background"
   - "Create iOS app icons with a blue rocket"
   - "Analyze this screenshot" (attach an image)

4. **Watch for console output**:
   - If loaded: You'll see `🎨 Visual Toolkit Plugin initializing...`
   - If tools work: The AI will use tools like `generate_image` or `generate_app_icon`

### Method 5: Check OpenCode Desktop Logs

Look for startup messages in Console.app:
```bash
# Filter for opencode messages
log show --predicate 'process == "OpenCode"' --last 5m | grep -i "visual\|toolkit\|plugin"
```

Look for:
```
🎨 Visual Toolkit Plugin initializing...
✅ Visual Toolkit Plugin initialized successfully
📦 Registered 19 tools across 6 categories
```

## 🎯 Available Tools (19 Total)

Once loaded, these tools are available to the AI:

### Core Image Tools (3)
- `generate_image` - Create images from text prompts
- `edit_image` - Modify existing images
- `restore_image` - Enhance/restore image quality

### App Asset Tools (5)
- `generate_app_icon` - Complete icon sets for iOS/Android
- `generate_app_screenshots` - App Store screenshots
- `resize_for_devices` - Device-specific resizing
- `generate_device_mockup` - Screenshot in device frame
- `generate_launch_images` - Splash screens

### Analysis Tools (3)
- `analyze_screenshot` - UI/UX analysis
- `compare_screenshots` - Visual diff
- `analyze_mockup` - Extract design specs

### Design-to-Code Tools (2)
- `mockup_to_code` - Design → Component code
- `sketch_to_code` - Wireframe → Component code

### Documentation Tools (4)
- `generate_architecture_diagram` - System diagrams
- `generate_sequence_diagram` - Interaction flows
- `generate_readme_banner` - Project banners
- `generate_social_preview` - OG images

### Video Tools (2)
- `generate_video` - Text-to-video
- `image_to_video` - Animate static images

## 🔧 Troubleshooting

### Plugin Not Loading?

1. **Check config**:
   ```bash
   cat ~/.config/opencode/opencode.json | grep visual
   ```

2. **Reinstall**:
   ```bash
   cd ~/.config/opencode
   bun install file:///Volumes/DevHub_ext/factory/toolbox/opencode-nanobanana
   ```

3. **Rebuild plugin**:
   ```bash
   cd /Volumes/DevHub_ext/factory/toolbox/opencode-nanobanana
   npm run build
   ```

4. **Restart OpenCode Desktop** completely (quit and relaunch)

### Tools Not Working?

Check for API key:
```bash
echo $GEMINI_API_KEY
```

If empty, set it:
```bash
export GEMINI_API_KEY="your-key-here"
# Or add to ~/.zshrc or ~/.bashrc
```

## 📝 Quick Test Commands

Once OpenCode Desktop is running, try:

```
# Simple image generation
"Generate a sunset over mountains"

# App icon creation
"Create iOS and Android app icons with a blue rocket on gradient"

# Screenshot analysis
"Analyze this screenshot for accessibility issues"
(attach a screenshot)

# Architecture diagram
"Generate an architecture diagram for a microservices setup with API gateway, auth service, and database"
```

## ✨ Development Mode

Since the plugin is symlinked:
1. Make changes to source files in `/Volumes/DevHub_ext/factory/toolbox/opencode-nanobanana/src/`
2. Run `npm run build`
3. Restart OpenCode Desktop
4. Changes are immediately available!

No need to reinstall or republish during development.
