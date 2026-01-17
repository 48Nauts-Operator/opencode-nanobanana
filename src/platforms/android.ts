/**
 * Android Platform Module
 *
 * Provides Android-specific asset specifications including:
 * - Icon sizes for all density buckets (mdpi through xxxhdpi)
 * - Screenshot sizes for phones and tablets
 * - Adaptive icon XML generation
 * - Density path helpers
 */

export interface AndroidDensity {
  name: string;
  scale: number;
  iconSize: number;
  directory: string;
}

export interface AndroidIconSize {
  density: string;
  size: number;
  directory: string;
  filename: string;
}

export interface AndroidScreenshotSize {
  device: string;
  width: number;
  height: number;
  description: string;
}

/**
 * Android density buckets with their scale factors
 * Based on Android's density-independent pixel (dp) system
 */
export const ANDROID_DENSITIES: AndroidDensity[] = [
  { name: 'mdpi', scale: 1.0, iconSize: 48, directory: 'mipmap-mdpi' },
  { name: 'hdpi', scale: 1.5, iconSize: 72, directory: 'mipmap-hdpi' },
  { name: 'xhdpi', scale: 2.0, iconSize: 96, directory: 'mipmap-xhdpi' },
  { name: 'xxhdpi', scale: 3.0, iconSize: 144, directory: 'mipmap-xxhdpi' },
  { name: 'xxxhdpi', scale: 4.0, iconSize: 192, directory: 'mipmap-xxxhdpi' },
];

/**
 * Complete Android icon size specifications
 * Covers all density buckets for launcher icons
 */
export const ANDROID_ICON_SIZES: AndroidIconSize[] = ANDROID_DENSITIES.map(density => ({
  density: density.name,
  size: density.iconSize,
  directory: density.directory,
  filename: 'ic_launcher.png',
}));

/**
 * Android screenshot sizes for Google Play Store
 * Based on common device resolutions and aspect ratios
 */
export const ANDROID_SCREENSHOT_SIZES: AndroidScreenshotSize[] = [
  // Phones - Portrait
  { device: 'Phone 16:9', width: 1080, height: 1920, description: 'Standard phone portrait' },
  { device: 'Phone 18:9', width: 1080, height: 2160, description: 'Tall phone portrait' },
  { device: 'Phone 19:9', width: 1080, height: 2280, description: 'Extra tall phone portrait' },
  { device: 'Phone 20:9', width: 1080, height: 2400, description: 'Ultra tall phone portrait' },

  // Phones - Landscape
  { device: 'Phone 16:9 Landscape', width: 1920, height: 1080, description: 'Standard phone landscape' },
  { device: 'Phone 18:9 Landscape', width: 2160, height: 1080, description: 'Tall phone landscape' },

  // Tablets - Portrait
  { device: 'Tablet 7"', width: 1200, height: 1920, description: '7-inch tablet portrait' },
  { device: 'Tablet 10"', width: 1600, height: 2560, description: '10-inch tablet portrait' },

  // Tablets - Landscape
  { device: 'Tablet 7" Landscape', width: 1920, height: 1200, description: '7-inch tablet landscape' },
  { device: 'Tablet 10" Landscape', width: 2560, height: 1600, description: '10-inch tablet landscape' },
];

/**
 * Generates adaptive icon XML content for Android
 * Adaptive icons consist of foreground and background layers
 *
 * @param foregroundPath - Path to foreground drawable (default: @mipmap/ic_launcher_foreground)
 * @param backgroundPath - Path to background drawable (default: @mipmap/ic_launcher_background)
 * @returns Valid ic_launcher.xml content for res/mipmap-anydpi-v26/
 */
export function generateAdaptiveIconXml(
  foregroundPath: string = '@mipmap/ic_launcher_foreground',
  backgroundPath: string = '@mipmap/ic_launcher_background'
): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="${backgroundPath}" />
    <foreground android:drawable="${foregroundPath}" />
</adaptive-icon>`;
}

/**
 * Generates adaptive icon XML with monochrome layer (Android 13+)
 * Includes monochrome layer for themed icons
 *
 * @param foregroundPath - Path to foreground drawable
 * @param backgroundPath - Path to background drawable
 * @param monochromePath - Path to monochrome drawable (default: @mipmap/ic_launcher_foreground)
 * @returns Valid ic_launcher.xml content with monochrome support
 */
export function generateAdaptiveIconXmlWithMonochrome(
  foregroundPath: string = '@mipmap/ic_launcher_foreground',
  backgroundPath: string = '@mipmap/ic_launcher_background',
  monochromePath: string = '@mipmap/ic_launcher_foreground'
): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="${backgroundPath}" />
    <foreground android:drawable="${foregroundPath}" />
    <monochrome android:drawable="${monochromePath}" />
</adaptive-icon>`;
}

/**
 * Gets the mipmap directory path for a given density
 *
 * @param density - Density name (e.g., 'mdpi', 'hdpi', 'xhdpi')
 * @returns Directory path in format 'mipmap-{density}'
 */
export function getDensityPath(density: string): string {
  return `mipmap-${density}`;
}

/**
 * Gets icon size in pixels for a given density
 *
 * @param density - Density name
 * @returns Icon size in pixels, or null if density not found
 */
export function getIconSizeForDensity(density: string): number | null {
  const found = ANDROID_DENSITIES.find(d => d.name === density);
  return found ? found.iconSize : null;
}

/**
 * Calculates the pixel size for a given dp value at a specific density
 *
 * @param dp - Value in density-independent pixels
 * @param density - Density name
 * @returns Pixel size, or null if density not found
 */
export function dpToPixels(dp: number, density: string): number | null {
  const found = ANDROID_DENSITIES.find(d => d.name === density);
  return found ? Math.round(dp * found.scale) : null;
}

/**
 * Android adaptive icon specifications
 * Defines the safe zone and dimensions for foreground/background layers
 */
export const ADAPTIVE_ICON_SPECS = {
  fullSize: 108, // dp - full drawable size (108x108 dp)
  visibleSize: 72, // dp - always visible area (72x72 dp)
  safeZone: 66, // dp - safe zone for important content (66x66 dp)
  maskPadding: 18, // dp - padding from edge to mask (108 - 72) / 2
};
