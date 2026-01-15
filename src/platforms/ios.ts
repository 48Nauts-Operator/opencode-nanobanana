/**
 * iOS Platform Specifications
 * Complete icon and screenshot sizes for iOS, iPadOS, watchOS, and CarPlay
 */

export interface IconSize {
  size: number; // Size in points
  scale: number; // 1x, 2x, or 3x
  pixels: number; // Actual pixel dimension
  idiom: 'iphone' | 'ipad' | 'ios-marketing' | 'watch' | 'car';
  filename: string;
}

export interface ScreenshotSize {
  name: string;
  width: number;
  height: number;
  device: string;
}

/**
 * Complete iOS icon sizes (18+ sizes)
 * Covers iPhone, iPad, App Store, Notifications, Settings, Spotlight
 */
export const IOS_ICON_SIZES: IconSize[] = [
  // iPhone App Icon (60pt)
  { size: 60, scale: 2, pixels: 120, idiom: 'iphone', filename: 'Icon-App-60x60@2x.png' },
  { size: 60, scale: 3, pixels: 180, idiom: 'iphone', filename: 'Icon-App-60x60@3x.png' },

  // iPhone Notification Icon (20pt)
  { size: 20, scale: 2, pixels: 40, idiom: 'iphone', filename: 'Icon-App-20x20@2x.png' },
  { size: 20, scale: 3, pixels: 60, idiom: 'iphone', filename: 'Icon-App-20x20@3x.png' },

  // iPhone Settings Icon (29pt)
  { size: 29, scale: 2, pixels: 58, idiom: 'iphone', filename: 'Icon-App-29x29@2x.png' },
  { size: 29, scale: 3, pixels: 87, idiom: 'iphone', filename: 'Icon-App-29x29@3x.png' },

  // iPhone Spotlight Icon (40pt)
  { size: 40, scale: 2, pixels: 80, idiom: 'iphone', filename: 'Icon-App-40x40@2x.png' },
  { size: 40, scale: 3, pixels: 120, idiom: 'iphone', filename: 'Icon-App-40x40@3x.png' },

  // iPad App Icon (76pt)
  { size: 76, scale: 1, pixels: 76, idiom: 'ipad', filename: 'Icon-App-76x76@1x.png' },
  { size: 76, scale: 2, pixels: 152, idiom: 'ipad', filename: 'Icon-App-76x76@2x.png' },

  // iPad Pro App Icon (83.5pt)
  { size: 83.5, scale: 2, pixels: 167, idiom: 'ipad', filename: 'Icon-App-83.5x83.5@2x.png' },

  // iPad Notification Icon (20pt)
  { size: 20, scale: 1, pixels: 20, idiom: 'ipad', filename: 'Icon-App-20x20@1x.png' },
  { size: 20, scale: 2, pixels: 40, idiom: 'ipad', filename: 'Icon-App-20x20@2x.png' },

  // iPad Settings Icon (29pt)
  { size: 29, scale: 1, pixels: 29, idiom: 'ipad', filename: 'Icon-App-29x29@1x.png' },
  { size: 29, scale: 2, pixels: 58, idiom: 'ipad', filename: 'Icon-App-29x29@2x.png' },

  // iPad Spotlight Icon (40pt)
  { size: 40, scale: 1, pixels: 40, idiom: 'ipad', filename: 'Icon-App-40x40@1x.png' },
  { size: 40, scale: 2, pixels: 80, idiom: 'ipad', filename: 'Icon-App-40x40@2x.png' },

  // App Store Icon (1024pt)
  {
    size: 1024,
    scale: 1,
    pixels: 1024,
    idiom: 'ios-marketing',
    filename: 'Icon-App-1024x1024@1x.png',
  },
];

/**
 * watchOS icon sizes (optional export)
 * Notification, Companion Settings, Home Screen, Short Look
 */
export const WATCHOS_ICON_SIZES: IconSize[] = [
  // watchOS App Icon - 38mm
  { size: 40, scale: 2, pixels: 80, idiom: 'watch', filename: 'Icon-Watch-40x40@2x.png' },

  // watchOS App Icon - 40mm
  { size: 44, scale: 2, pixels: 88, idiom: 'watch', filename: 'Icon-Watch-44x44@2x.png' },

  // watchOS App Icon - 41mm
  { size: 45, scale: 2, pixels: 90, idiom: 'watch', filename: 'Icon-Watch-45x45@2x.png' },

  // watchOS App Icon - 42mm
  { size: 46, scale: 2, pixels: 92, idiom: 'watch', filename: 'Icon-Watch-46x46@2x.png' },

  // watchOS App Icon - 44mm
  { size: 50, scale: 2, pixels: 100, idiom: 'watch', filename: 'Icon-Watch-50x50@2x.png' },

  // watchOS Notification - 38mm
  { size: 24, scale: 2, pixels: 48, idiom: 'watch', filename: 'Icon-Watch-24x24@2x.png' },

  // watchOS Notification - 42mm
  { size: 27.5, scale: 2, pixels: 55, idiom: 'watch', filename: 'Icon-Watch-27.5x27.5@2x.png' },

  // watchOS Companion Settings
  { size: 29, scale: 2, pixels: 58, idiom: 'watch', filename: 'Icon-Watch-29x29@2x.png' },
  { size: 29, scale: 3, pixels: 87, idiom: 'watch', filename: 'Icon-Watch-29x29@3x.png' },

  // watchOS Home Screen - 40mm
  {
    size: 40,
    scale: 2,
    pixels: 80,
    idiom: 'watch',
    filename: 'Icon-Watch-HomeScreen-40x40@2x.png',
  },

  // watchOS App Store
  { size: 1024, scale: 1, pixels: 1024, idiom: 'watch', filename: 'Icon-Watch-1024x1024@1x.png' },
];

/**
 * CarPlay icon sizes (optional export)
 */
export const CARPLAY_ICON_SIZES: IconSize[] = [
  // CarPlay App Icon (60pt)
  { size: 60, scale: 2, pixels: 120, idiom: 'car', filename: 'Icon-CarPlay-60x60@2x.png' },
  { size: 60, scale: 3, pixels: 180, idiom: 'car', filename: 'Icon-CarPlay-60x60@3x.png' },
];

/**
 * iOS Screenshot sizes for all devices
 * Based on native resolutions for App Store screenshots
 */
export const IOS_SCREENSHOT_SIZES: ScreenshotSize[] = [
  // iPhone 16 Pro Max / 15 Pro Max / 14 Pro Max (6.9" / 6.7")
  { name: '6.9-inch', width: 1320, height: 2868, device: 'iPhone 16 Pro Max' },
  { name: '6.7-inch', width: 1290, height: 2796, device: 'iPhone 15 Pro Max' },

  // iPhone 16 Pro / 15 Pro / 14 Pro (6.3" / 6.1")
  { name: '6.3-inch', width: 1206, height: 2622, device: 'iPhone 16 Pro' },
  { name: '6.1-inch', width: 1179, height: 2556, device: 'iPhone 15 Pro' },

  // iPhone 13 Pro Max / 12 Pro Max (6.7")
  { name: '6.7-inch-legacy', width: 1284, height: 2778, device: 'iPhone 13 Pro Max' },

  // iPhone 13 / 12 (6.1")
  { name: '6.1-inch-legacy', width: 1170, height: 2532, device: 'iPhone 13' },

  // iPhone 8 Plus / 7 Plus / 6s Plus (5.5")
  { name: '5.5-inch', width: 1242, height: 2208, device: 'iPhone 8 Plus' },

  // iPad Pro 12.9" (3rd gen and later)
  { name: 'iPad-12.9', width: 2048, height: 2732, device: 'iPad Pro 12.9"' },

  // iPad Pro 11" / iPad Air 11"
  { name: 'iPad-11', width: 1668, height: 2388, device: 'iPad Pro 11"' },

  // iPad Pro 10.5" / iPad Air 10.9"
  { name: 'iPad-10.5', width: 1668, height: 2224, device: 'iPad Pro 10.5"' },

  // iPad 9.7" / iPad mini
  { name: 'iPad-9.7', width: 1536, height: 2048, device: 'iPad 9.7"' },
];

/**
 * Generate Contents.json for Xcode asset catalog
 * @param sizes Array of icon sizes to include
 * @returns Valid Xcode Contents.json object
 */
export function generateContentsJson(sizes: IconSize[]): object {
  const images = sizes.map((iconSize) => ({
    filename: iconSize.filename,
    idiom: iconSize.idiom,
    scale: `${iconSize.scale}x`,
    size: `${iconSize.size}x${iconSize.size}`,
  }));

  return {
    images,
    info: {
      author: 'opencode-visual-toolkit',
      version: 1,
    },
  };
}

/**
 * Get icon filename based on size, scale, and idiom
 * @param size Size in points
 * @param scale Scale multiplier (1, 2, or 3)
 * @param idiom Device idiom
 * @returns Filename string
 */
export function getIconFilename(
  size: number,
  scale: number,
  idiom: 'iphone' | 'ipad' | 'ios-marketing' | 'watch' | 'car'
): string {
  const prefix =
    idiom === 'watch'
      ? 'Icon-Watch'
      : idiom === 'car'
        ? 'Icon-CarPlay'
        : idiom === 'ios-marketing'
          ? 'Icon-App'
          : 'Icon-App';

  return `${prefix}-${size}x${size}@${scale}x.png`;
}
