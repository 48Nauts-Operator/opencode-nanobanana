import { describe, it, expect } from 'vitest';
import { IOS_ICON_SIZES, generateContentsJson } from '../../src/platforms/ios';
import { ANDROID_DENSITIES, ANDROID_ICON_SIZES, generateAdaptiveIconXml } from '../../src/platforms/android';
import { MACOS_ICON_SIZES } from '../../src/platforms/macos';
import { WEB_ICON_SIZES, generateWebManifestIcons } from '../../src/platforms/web';

describe('Platform Modules', () => {
  describe('iOS Platform', () => {
    it('should have iOS icon sizes defined', () => {
      expect(IOS_ICON_SIZES).toBeDefined();
      expect(IOS_ICON_SIZES.length).toBeGreaterThan(0);
    });

    it('should include App Store icon at 1024x1024', () => {
      const appStoreIcon = IOS_ICON_SIZES.find(
        (icon) => icon.size === 1024 && icon.idiom === 'ios-marketing'
      );
      expect(appStoreIcon).toBeDefined();
    });

    it('should generate valid Contents.json', () => {
      const json = generateContentsJson(IOS_ICON_SIZES);
      expect(json).toHaveProperty('images');
      expect(json).toHaveProperty('info');
    });
  });

  describe('Android Platform', () => {
    it('should have Android densities defined', () => {
      expect(ANDROID_DENSITIES).toBeDefined();
      expect(ANDROID_DENSITIES.length).toBe(5);
    });

    it('should have Android icon sizes', () => {
      expect(ANDROID_ICON_SIZES).toBeDefined();
      expect(ANDROID_ICON_SIZES.length).toBeGreaterThanOrEqual(5);
    });

    it('should generate valid adaptive icon XML', () => {
      const xml = generateAdaptiveIconXml();
      expect(xml).toContain('<?xml version');
      expect(xml).toContain('<adaptive-icon');
      expect(xml).toContain('xmlns:android');
    });
  });

  describe('macOS Platform', () => {
    it('should have macOS icon sizes defined', () => {
      expect(MACOS_ICON_SIZES).toBeDefined();
      expect(MACOS_ICON_SIZES.length).toBeGreaterThan(0);
    });

    it('should include standard macOS sizes', () => {
      const sizes = MACOS_ICON_SIZES.map((icon) => icon.size);
      expect(sizes).toContain(16);
      expect(sizes).toContain(512);
    });
  });

  describe('Web Platform', () => {
    it('should have web icon sizes defined', () => {
      expect(WEB_ICON_SIZES).toBeDefined();
      expect(WEB_ICON_SIZES.length).toBeGreaterThan(0);
    });

    it('should include PWA icons', () => {
      const pwaIcons = WEB_ICON_SIZES.filter((icon) => icon.purpose === 'pwa');
      expect(pwaIcons.length).toBeGreaterThanOrEqual(2);
    });

    it('should generate web manifest icons', () => {
      const icons = generateWebManifestIcons();
      expect(Array.isArray(icons)).toBe(true);
      expect(icons.length).toBeGreaterThan(0);
    });
  });
});
