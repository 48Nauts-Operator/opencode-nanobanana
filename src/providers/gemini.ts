/**
 * Gemini Provider
 *
 * Direct integration with Google Gemini API for:
 * - Image generation (Imagen)
 * - Image editing
 * - Visual analysis
 * - Video generation (Veo)
 */

import { GoogleGenAI } from '@google/genai';

export interface ImageGenerationOptions {
  /** Aspect ratio for generated images (e.g., "1:1", "16:9", "9:16") */
  aspectRatio?: string;
  /** Number of images to generate (1-8) */
  count?: number;
  /** Width of generated image (optional) */
  width?: number;
  /** Height of generated image (optional) */
  height?: number;
}

export interface ImageEditOptions {
  /** Mask buffer for selective editing (optional) */
  mask?: Buffer;
}

export interface VideoGenerationOptions {
  /** Video duration in seconds (default: 5) */
  duration?: number;
  /** Aspect ratio for generated video (e.g., "16:9", "9:16", "1:1") */
  aspectRatio?: string;
}

export class GeminiProvider {
  private client: GoogleGenAI;
  private apiKey: string;

  constructor(apiKey?: string) {
    // Read from environment or constructor parameter
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || '';

    if (!this.apiKey) {
      throw new Error(
        'GEMINI_API_KEY is required. Set it in environment variables or pass to constructor.\n' +
        'Get your API key at: https://makersuite.google.com/app/apikey'
      );
    }

    this.client = new GoogleGenAI({ apiKey: this.apiKey });
  }

  /**
   * Generate images from text prompt using Imagen
   *
   * @param prompt Text description of the image to generate
   * @param options Generation options (aspect ratio, count, etc.)
   * @returns Array of image buffers
   */
  async generateImage(
    prompt: string,
    options: ImageGenerationOptions = {}
  ): Promise<Buffer[]> {
    try {
      const {
        aspectRatio = '1:1',
        count = 1,
        width,
        height
      } = options;

      // Validate count
      if (count < 1 || count > 8) {
        throw new Error('Count must be between 1 and 8');
      }

      // Generate multiple images if count > 1
      const promises: Promise<Buffer>[] = [];

      for (let i = 0; i < count; i++) {
        promises.push(this.generateSingleImage(prompt, { width, height, aspectRatio }));
      }

      const buffers = await Promise.all(promises);
      return buffers;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Image generation failed: ${error.message}`);
      }
      throw new Error('Image generation failed with unknown error');
    }
  }

  /**
   * Generate a single image using Gemini
   *
   * @param prompt Text description
   * @param _options Generation options (reserved for future use)
   * @returns Image buffer
   */
  private async generateSingleImage(
    prompt: string,
    _options: Omit<ImageGenerationOptions, 'count'>
  ): Promise<Buffer> {
    // Build the content request with image generation
    const config: any = {
      model: 'gemini-2.0-flash',
      contents: `Generate an image: ${prompt}`,
      config: {
        responseModalities: ['image']
      }
    };

    // Note: Aspect ratio and dimensions are handled by the prompt
    // The Gemini API will generate based on the description

    const result = await this.client.models.generateContent(config);

    // Extract image from response (result IS the response)
    if (result && result.candidates && result.candidates.length > 0) {
      const candidate = result.candidates[0];

      if (candidate && candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData && part.inlineData.data) {
            const base64Data = part.inlineData.data;
            return Buffer.from(base64Data, 'base64');
          }
        }
      }
    }

    throw new Error('No image was generated in the response');
  }

  /**
   * Edit an existing image using natural language
   *
   * @param imageBuffer Source image as buffer
   * @param prompt Edit instructions
   * @param _options Edit options (reserved for future use)
   * @returns Edited image buffer
   */
  async editImage(
    imageBuffer: Buffer,
    prompt: string,
    _options: ImageEditOptions = {}
  ): Promise<Buffer> {
    try {
      // Convert buffer to base64 for API
      const base64Image = imageBuffer.toString('base64');
      const mimeType = this.detectMimeType(imageBuffer);

      // Use Gemini with image input to generate edited version
      const result = await this.client.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
          {
            parts: [
              {
                inlineData: {
                  data: base64Image,
                  mimeType
                }
              },
              {
                text: `Edit this image: ${prompt}. Generate the edited version.`
              }
            ]
          }
        ],
        config: {
          responseModalities: ['image']
        }
      });

      // Extract edited image from response (result IS the response)
      if (result && result.candidates && result.candidates.length > 0) {
        const candidate = result.candidates[0];

        if (candidate && candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            if (part.inlineData && part.inlineData.data) {
              const base64Data = part.inlineData.data;
              return Buffer.from(base64Data, 'base64');
            }
          }
        }
      }

      throw new Error('No edited image was returned');
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Image editing failed: ${error.message}`);
      }
      throw new Error('Image editing failed with unknown error');
    }
  }

  /**
   * Analyze an image with AI vision
   *
   * @param imageBuffer Image to analyze
   * @param question Question or analysis prompt
   * @returns Analysis result as text
   */
  async analyzeImage(
    imageBuffer: Buffer,
    question: string = 'Describe this image in detail'
  ): Promise<string> {
    try {
      // Convert buffer to base64
      const base64Image = imageBuffer.toString('base64');
      const mimeType = this.detectMimeType(imageBuffer);

      // Use Gemini for image analysis
      const result = await this.client.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
          {
            parts: [
              {
                inlineData: {
                  data: base64Image,
                  mimeType
                }
              },
              {
                text: question
              }
            ]
          }
        ]
      });

      // Extract text from response (result IS the response)
      if (result && result.candidates && result.candidates.length > 0) {
        const candidate = result.candidates[0];

        if (candidate && candidate.content && candidate.content.parts) {
          // Extract text from all parts
          const texts: string[] = [];

          for (const part of candidate.content.parts) {
            if (part.text) {
              texts.push(part.text);
            }
          }

          if (texts.length > 0) {
            return texts.join('\n');
          }
        }
      }

      throw new Error('No analysis result returned');
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Image analysis failed: ${error.message}`);
      }
      throw new Error('Image analysis failed with unknown error');
    }
  }

  /**
   * Analyze multiple images together with AI vision
   *
   * @param imageBuffers Array of images to analyze together
   * @param question Question or analysis prompt
   * @returns Analysis result as text
   */
  async analyzeMultipleImages(
    imageBuffers: Buffer[],
    question: string = 'Compare and describe these images in detail'
  ): Promise<string> {
    try {
      // Convert all buffers to base64 and build parts array
      const parts: any[] = [];

      // Add all images first
      for (const imageBuffer of imageBuffers) {
        const base64Image = imageBuffer.toString('base64');
        const mimeType = this.detectMimeType(imageBuffer);

        parts.push({
          inlineData: {
            data: base64Image,
            mimeType
          }
        });
      }

      // Add the question/prompt last
      parts.push({
        text: question
      });

      // Use Gemini for multi-image analysis
      const result = await this.client.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
          {
            parts
          }
        ]
      });

      // Extract text from response
      if (result && result.candidates && result.candidates.length > 0) {
        const candidate = result.candidates[0];

        if (candidate && candidate.content && candidate.content.parts) {
          const texts: string[] = [];

          for (const part of candidate.content.parts) {
            if (part.text) {
              texts.push(part.text);
            }
          }

          if (texts.length > 0) {
            return texts.join('\n');
          }
        }
      }

      throw new Error('No analysis result returned');
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Multi-image analysis failed: ${error.message}`);
      }
      throw new Error('Multi-image analysis failed with unknown error');
    }
  }

  /**
   * Generate video from text prompt using Veo
   *
   * @param prompt Text description of the video to generate
   * @param options Video generation options (duration, aspect ratio)
   * @returns Video buffer
   */
  async generateVideo(
    prompt: string,
    options: VideoGenerationOptions = {}
  ): Promise<Buffer> {
    try {
      const { duration = 5, aspectRatio = '16:9' } = options;

      // Build the content request with video generation
      const config: any = {
        model: 'veo-2.0',
        contents: `Generate a ${duration}-second video with aspect ratio ${aspectRatio}: ${prompt}`,
        config: {
          responseModalities: ['video']
        }
      };

      const result = await this.client.models.generateContent(config);

      // Extract video from response
      if (result && result.candidates && result.candidates.length > 0) {
        const candidate = result.candidates[0];

        if (candidate && candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            if (part.inlineData && part.inlineData.data) {
              const base64Data = part.inlineData.data;
              return Buffer.from(base64Data, 'base64');
            }
          }
        }
      }

      throw new Error('No video was generated in the response');
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Video generation failed: ${error.message}`);
      }
      throw new Error('Video generation failed with unknown error');
    }
  }

  /**
   * Detect MIME type from buffer header
   *
   * @param buffer Image buffer
   * @returns MIME type string
   */
  private detectMimeType(buffer: Buffer): string {
    // Check magic numbers
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      return 'image/jpeg';
    }
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      return 'image/png';
    }
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
      return 'image/gif';
    }
    if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
      return 'image/webp';
    }

    // Default to PNG
    return 'image/png';
  }

  /**
   * Get API key (for testing/validation)
   */
  getApiKey(): string {
    return this.apiKey.substring(0, 10) + '...';
  }
}
