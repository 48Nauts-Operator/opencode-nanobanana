/**
 * macOS Platform Specifications
 * Complete icon sizes for macOS app icons (.icns)
 */

export interface MacOSIconSize {
  size: number; // Size in points
  scale: number; // 1x or 2x
  pixels: number; // Actual pixel dimension
  filename: string;
}

/**
 * Complete macOS icon sizes
 * Covers all required sizes for .icns icon sets
 * From 16x16 to 512x512 at 1x and 2x
 */
export const MACOS_ICON_SIZES: MacOSIconSize[] = [
  // 16pt icon
  { size: 16, scale: 1, pixels: 16, filename: 'icon_16x16.png' },
  { size: 16, scale: 2, pixels: 32, filename: 'icon_16x16@2x.png' },

  // 32pt icon
  { size: 32, scale: 1, pixels: 32, filename: 'icon_32x32.png' },
  { size: 32, scale: 2, pixels: 64, filename: 'icon_32x32@2x.png' },

  // 128pt icon
  { size: 128, scale: 1, pixels: 128, filename: 'icon_128x128.png' },
  { size: 128, scale: 2, pixels: 256, filename: 'icon_128x128@2x.png' },

  // 256pt icon
  { size: 256, scale: 1, pixels: 256, filename: 'icon_256x256.png' },
  { size: 256, scale: 2, pixels: 512, filename: 'icon_256x256@2x.png' },

  // 512pt icon
  { size: 512, scale: 1, pixels: 512, filename: 'icon_512x512.png' },
  { size: 512, scale: 2, pixels: 1024, filename: 'icon_512x512@2x.png' },
];

/**
 * Generate macOS iconset folder structure information
 * @returns Information about the iconset folder structure
 */
export function generateMacIconset(): {
  folderName: string;
  description: string;
  sizes: MacOSIconSize[];
} {
  return {
    folderName: 'AppIcon.iconset',
    description:
      'macOS iconset folder containing all required icon sizes. Use iconutil to convert to .icns file: iconutil -c icns AppIcon.iconset',
    sizes: MACOS_ICON_SIZES,
  };
}

/**
 * Get icon filename based on size and scale
 * @param size Size in points
 * @param scale Scale multiplier (1 or 2)
 * @returns Filename string following macOS conventions
 */
export function getIconFilename(size: number, scale: number): string {
  if (scale === 1) {
    return `icon_${size}x${size}.png`;
  }
  return `icon_${size}x${size}@2x.png`;
}
