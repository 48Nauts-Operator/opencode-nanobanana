/**
 * Web Platform Specifications
 * Complete icon sizes for web applications including favicon and PWA icons
 */

export interface WebIconSize {
  size: number; // Size in pixels (square)
  purpose: 'favicon' | 'apple-touch' | 'pwa';
  filename: string;
  description: string;
}

/**
 * Web Manifest Icon specification
 * Used by PWA manifest.json
 */
export interface WebManifestIcon {
  src: string;
  sizes: string;
  type: string;
  purpose?: string;
}

/**
 * Complete web icon sizes
 * Includes favicon (16, 32, 48), apple-touch-icon (180), PWA icons (192, 512)
 */
export const WEB_ICON_SIZES: WebIconSize[] = [
  // Favicon sizes (for browsers)
  { size: 16, purpose: 'favicon', filename: 'favicon-16x16.png', description: 'Browser tab icon (small)' },
  { size: 32, purpose: 'favicon', filename: 'favicon-32x32.png', description: 'Browser tab icon (medium)' },
  { size: 48, purpose: 'favicon', filename: 'favicon-48x48.png', description: 'Browser tab icon (large)' },

  // Apple Touch Icon
  { size: 180, purpose: 'apple-touch', filename: 'apple-touch-icon.png', description: 'iOS home screen icon' },

  // PWA Icons (Progressive Web App)
  { size: 192, purpose: 'pwa', filename: 'icon-192x192.png', description: 'PWA icon (standard)' },
  { size: 512, purpose: 'pwa', filename: 'icon-512x512.png', description: 'PWA icon (large/splash)' },
];

/**
 * Generate Web Manifest icons array for manifest.json
 * @param basePath Base path to icon directory (e.g., '/icons' or './icons')
 * @returns Array of manifest icon objects
 */
export function generateWebManifestIcons(basePath: string = '/icons'): WebManifestIcon[] {
  const pwaIcons = WEB_ICON_SIZES.filter(icon => icon.purpose === 'pwa');

  return pwaIcons.map(icon => ({
    src: `${basePath}/${icon.filename}`,
    sizes: `${icon.size}x${icon.size}`,
    type: 'image/png',
    purpose: 'any maskable', // Support both normal and maskable (Android adaptive)
  }));
}

/**
 * Generate favicon information
 * Returns HTML link tags and .ico conversion instructions
 * @returns Favicon configuration and HTML snippets
 */
export function generateFavicon(): {
  sizes: WebIconSize[];
  htmlSnippets: string[];
  icoInstructions: string;
} {
  const faviconSizes = WEB_ICON_SIZES.filter(icon => icon.purpose === 'favicon');
  const appleTouchIcon = WEB_ICON_SIZES.find(icon => icon.purpose === 'apple-touch');

  const htmlSnippets: string[] = [];

  // Standard favicon.ico reference
  htmlSnippets.push('<link rel="icon" href="/favicon.ico" sizes="any">');

  // PNG favicons with size hints
  faviconSizes.forEach(icon => {
    htmlSnippets.push(`<link rel="icon" type="image/png" sizes="${icon.size}x${icon.size}" href="/${icon.filename}">`);
  });

  // Apple touch icon
  if (appleTouchIcon) {
    htmlSnippets.push(`<link rel="apple-touch-icon" href="/${appleTouchIcon.filename}">`);
  }

  // SVG favicon (modern browsers)
  htmlSnippets.push('<link rel="icon" type="image/svg+xml" href="/favicon.svg">');

  return {
    sizes: faviconSizes,
    htmlSnippets,
    icoInstructions:
      'To create favicon.ico: Use a multi-size ICO converter to combine 16x16, 32x32, and 48x48 PNG files into a single .ico file. Tools: ImageMagick (convert), online converters, or npm packages like png-to-ico.',
  };
}

/**
 * Get web icon filename based on purpose and size
 * @param purpose Icon purpose (favicon, apple-touch, pwa)
 * @param size Size in pixels
 * @returns Filename string following web conventions
 */
export function getWebIconFilename(purpose: 'favicon' | 'apple-touch' | 'pwa', size: number): string {
  if (purpose === 'apple-touch') {
    return 'apple-touch-icon.png';
  }
  if (purpose === 'pwa') {
    return `icon-${size}x${size}.png`;
  }
  return `favicon-${size}x${size}.png`;
}

/**
 * Generate complete PWA manifest.json structure
 * @param config PWA configuration
 * @returns manifest.json object
 */
export function generatePWAManifest(config: {
  name: string;
  shortName: string;
  description?: string;
  themeColor?: string;
  backgroundColor?: string;
  display?: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser';
  orientation?: 'portrait' | 'landscape' | 'any';
  iconBasePath?: string;
}): Record<string, unknown> {
  const {
    name,
    shortName,
    description = '',
    themeColor = '#000000',
    backgroundColor = '#ffffff',
    display = 'standalone',
    orientation = 'any',
    iconBasePath = '/icons',
  } = config;

  return {
    name,
    short_name: shortName,
    description,
    theme_color: themeColor,
    background_color: backgroundColor,
    display,
    orientation,
    start_url: '/',
    scope: '/',
    icons: generateWebManifestIcons(iconBasePath),
  };
}
