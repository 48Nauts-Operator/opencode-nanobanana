import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GeminiProvider } from '../../src/providers/gemini';

// Mock @google/genai module
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: vi.fn(),
    },
  })),
}));

describe('GeminiProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-api-key';
  });

  describe('constructor', () => {
    it('should accept API key from constructor parameter', () => {
      const provider = new GeminiProvider('custom-api-key');
      expect(provider).toBeDefined();
    });

    it('should use environment variable if no parameter provided', () => {
      process.env.GEMINI_API_KEY = 'env-api-key';
      const provider = new GeminiProvider();
      expect(provider).toBeDefined();
    });

    it('should throw error if no API key provided', () => {
      delete process.env.GEMINI_API_KEY;
      expect(() => new GeminiProvider()).toThrow('GEMINI_API_KEY is required');
    });
  });

  describe('generateImage', () => {
    it('should generate images', async () => {
      const provider = new GeminiProvider();
      const mockGenerateContent = (provider as any).client.models.generateContent;

      mockGenerateContent.mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: {
                    data: Buffer.from('test').toString('base64'),
                    mimeType: 'image/png',
                  },
                },
              ],
            },
          },
        ],
      });

      const result = await provider.generateImage('Test prompt');

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Buffer);
    });

    it('should validate count is within range', async () => {
      const provider = new GeminiProvider();

      await expect(
        provider.generateImage('Test', { count: 0 })
      ).rejects.toThrow('Count must be between 1 and 8');

      await expect(
        provider.generateImage('Test', { count: 9 })
      ).rejects.toThrow('Count must be between 1 and 8');
    });
  });

  describe('editImage', () => {
    it('should edit images', async () => {
      const provider = new GeminiProvider();
      const mockGenerateContent = (provider as any).client.models.generateContent;

      mockGenerateContent.mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: {
                    data: Buffer.from('edited').toString('base64'),
                    mimeType: 'image/png',
                  },
                },
              ],
            },
          },
        ],
      });

      const sourceBuffer = Buffer.from('source');
      const result = await provider.editImage(sourceBuffer, 'Edit instruction');

      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('analyzeImage', () => {
    it('should analyze images and return text', async () => {
      const provider = new GeminiProvider();
      const mockGenerateContent = (provider as any).client.models.generateContent;

      mockGenerateContent.mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [{ text: 'Analysis result' }],
            },
          },
        ],
      });

      const imageBuffer = Buffer.from('test-image');
      const result = await provider.analyzeImage(imageBuffer, 'What is this?');

      expect(result).toBe('Analysis result');
    });
  });

  describe('generateVideo', () => {
    it('should generate videos', async () => {
      const provider = new GeminiProvider();
      const mockGenerateContent = (provider as any).client.models.generateContent;

      mockGenerateContent.mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: {
                    data: Buffer.from('video').toString('base64'),
                    mimeType: 'video/mp4',
                  },
                },
              ],
            },
          },
        ],
      });

      const result = await provider.generateVideo('Test video');

      expect(result).toBeInstanceOf(Buffer);
    });
  });
});
