/**
 * watchOS Platform Specifications
 *
 * Defines icon sizes and specifications for Apple Watch apps across all watch sizes.
 * Supports notification, home screen, short look, and App Store icons.
 */

export interface WatchOSIconSize {
  size: number;          // Size in points
  scale: number;         // Scale factor (2x, 3x, etc.)
  pixels: number;        // Actual pixel dimensions (size * scale)
  context: string;       // Where icon appears (notification, home, short-look, store)
  watchSize: string;     // Watch model size (38mm, 40mm, 41mm, 42mm, 44mm, 45mm, 49mm, ultra)
  filename: string;      // Standard filename
}

/**
 * Complete watchOS icon sizes for all watch models and contexts
 * Based on Apple's Human Interface Guidelines for watchOS
 */
export const WATCHOS_ICON_SIZES: WatchOSIconSize[] = [
  // 38mm Apple Watch (Series 1, 2, 3)
  { size: 24, scale: 2, pixels: 48, context: 'notification', watchSize: '38mm', filename: 'Icon-Notification-38mm@2x.png' },
  { size: 27.5, scale: 2, pixels: 55, context: 'short-look', watchSize: '38mm', filename: 'Icon-ShortLook-38mm@2x.png' },
  { size: 40, scale: 2, pixels: 80, context: 'home', watchSize: '38mm', filename: 'Icon-Home-38mm@2x.png' },
  { size: 86, scale: 2, pixels: 172, context: 'short-look', watchSize: '38mm', filename: 'Icon-ShortLook-Large-38mm@2x.png' },

  // 40mm Apple Watch (Series 4, 5, 6, SE)
  { size: 24, scale: 2, pixels: 48, context: 'notification', watchSize: '40mm', filename: 'Icon-Notification-40mm@2x.png' },
  { size: 27.5, scale: 2, pixels: 55, context: 'short-look', watchSize: '40mm', filename: 'Icon-ShortLook-40mm@2x.png' },
  { size: 40, scale: 2, pixels: 80, context: 'home', watchSize: '40mm', filename: 'Icon-Home-40mm@2x.png' },
  { size: 86, scale: 2, pixels: 172, context: 'short-look', watchSize: '40mm', filename: 'Icon-ShortLook-Large-40mm@2x.png' },
  { size: 92, scale: 2, pixels: 184, context: 'home', watchSize: '40mm', filename: 'Icon-Home-Large-40mm@2x.png' },

  // 41mm Apple Watch (Series 7, 8, 9)
  { size: 24, scale: 2, pixels: 48, context: 'notification', watchSize: '41mm', filename: 'Icon-Notification-41mm@2x.png' },
  { size: 27.5, scale: 2, pixels: 55, context: 'short-look', watchSize: '41mm', filename: 'Icon-ShortLook-41mm@2x.png' },
  { size: 40, scale: 2, pixels: 80, context: 'home', watchSize: '41mm', filename: 'Icon-Home-41mm@2x.png' },
  { size: 86, scale: 2, pixels: 172, context: 'short-look', watchSize: '41mm', filename: 'Icon-ShortLook-Large-41mm@2x.png' },
  { size: 92, scale: 2, pixels: 184, context: 'home', watchSize: '41mm', filename: 'Icon-Home-Large-41mm@2x.png' },

  // 42mm Apple Watch (Series 1, 2, 3)
  { size: 24, scale: 2, pixels: 48, context: 'notification', watchSize: '42mm', filename: 'Icon-Notification-42mm@2x.png' },
  { size: 27.5, scale: 2, pixels: 55, context: 'short-look', watchSize: '42mm', filename: 'Icon-ShortLook-42mm@2x.png' },
  { size: 44, scale: 2, pixels: 88, context: 'home', watchSize: '42mm', filename: 'Icon-Home-42mm@2x.png' },
  { size: 98, scale: 2, pixels: 196, context: 'short-look', watchSize: '42mm', filename: 'Icon-ShortLook-Large-42mm@2x.png' },

  // 44mm Apple Watch (Series 4, 5, 6, SE)
  { size: 24, scale: 2, pixels: 48, context: 'notification', watchSize: '44mm', filename: 'Icon-Notification-44mm@2x.png' },
  { size: 27.5, scale: 2, pixels: 55, context: 'short-look', watchSize: '44mm', filename: 'Icon-ShortLook-44mm@2x.png' },
  { size: 44, scale: 2, pixels: 88, context: 'home', watchSize: '44mm', filename: 'Icon-Home-44mm@2x.png' },
  { size: 98, scale: 2, pixels: 196, context: 'short-look', watchSize: '44mm', filename: 'Icon-ShortLook-Large-44mm@2x.png' },
  { size: 100, scale: 2, pixels: 200, context: 'home', watchSize: '44mm', filename: 'Icon-Home-Large-44mm@2x.png' },

  // 45mm Apple Watch (Series 7, 8, 9)
  { size: 24, scale: 2, pixels: 48, context: 'notification', watchSize: '45mm', filename: 'Icon-Notification-45mm@2x.png' },
  { size: 27.5, scale: 2, pixels: 55, context: 'short-look', watchSize: '45mm', filename: 'Icon-ShortLook-45mm@2x.png' },
  { size: 44, scale: 2, pixels: 88, context: 'home', watchSize: '45mm', filename: 'Icon-Home-45mm@2x.png' },
  { size: 98, scale: 2, pixels: 196, context: 'short-look', watchSize: '45mm', filename: 'Icon-ShortLook-Large-45mm@2x.png' },
  { size: 100, scale: 2, pixels: 200, context: 'home', watchSize: '45mm', filename: 'Icon-Home-Large-45mm@2x.png' },

  // 49mm Apple Watch (Series 9, Ultra, Ultra 2)
  { size: 24, scale: 2, pixels: 48, context: 'notification', watchSize: '49mm', filename: 'Icon-Notification-49mm@2x.png' },
  { size: 27.5, scale: 2, pixels: 55, context: 'short-look', watchSize: '49mm', filename: 'Icon-ShortLook-49mm@2x.png' },
  { size: 44, scale: 2, pixels: 88, context: 'home', watchSize: '49mm', filename: 'Icon-Home-49mm@2x.png' },
  { size: 98, scale: 2, pixels: 196, context: 'short-look', watchSize: '49mm', filename: 'Icon-ShortLook-Large-49mm@2x.png' },
  { size: 108, scale: 2, pixels: 216, context: 'home', watchSize: '49mm', filename: 'Icon-Home-Large-49mm@2x.png' },

  // App Store icon (1024x1024, universal)
  { size: 1024, scale: 1, pixels: 1024, context: 'store', watchSize: 'all', filename: 'Icon-AppStore-1024x1024.png' },
];

/**
 * Generates Contents.json for Xcode watchOS asset catalog
 */
export function generateWatchContentsJson(sizes: WatchOSIconSize[]): string {
  const images = sizes.map(s => ({
    filename: s.filename,
    idiom: 'watch',
    role: s.context,
    scale: `${s.scale}x`,
    size: `${s.size}x${s.size}`,
    subtype: s.watchSize !== 'all' ? s.watchSize : undefined,
  }));

  return JSON.stringify({
    images: images.filter(img => img.subtype !== undefined),
    info: {
      author: 'opencode-visual-toolkit',
      version: 1,
    },
  }, null, 2);
}

/**
 * Gets appropriate icon filename for watch size and context
 */
export function getWatchIconFilename(size: number, context: string, watchSize: string): string {
  if (size === 1024) {
    return 'Icon-AppStore-1024x1024.png';
  }

  // Normalize context for filename
  const contextMap: Record<string, string> = {
    notification: 'Notification',
    home: 'Home',
    'short-look': 'ShortLook',
    store: 'AppStore',
  };

  const contextName = contextMap[context] || context;
  return `Icon-${contextName}-${watchSize}@2x.png`;
}

/**
 * Groups icon sizes by watch size for organized generation
 */
export function groupIconsByWatchSize(): Record<string, WatchOSIconSize[]> {
  const grouped: Record<string, WatchOSIconSize[]> = {};

  for (const iconSize of WATCHOS_ICON_SIZES) {
    const key = iconSize.watchSize;
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(iconSize);
  }

  return grouped;
}

/**
 * Gets all unique contexts (notification, home, short-look, store)
 */
export function getWatchContexts(): string[] {
  const contexts = new Set(WATCHOS_ICON_SIZES.map(s => s.context));
  return Array.from(contexts);
}
