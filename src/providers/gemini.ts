import { GoogleGenAI } from '@google/genai';

export interface VideoGenerationOptions {
  aspectRatio?: '16:9' | '9:16';
  resolution?: '720p' | '1080p';
  duration?: 4 | 6 | 8;
  numberOfVideos?: number;
  negativePrompt?: string;
}

export interface ImageGenerationOptions {
  aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
  count?: number;
}

export interface ImageEditOptions {
  mask?: Buffer;
}

export interface ImageGenerationResult {
  buffer: Buffer;
  mimeType: string;
  generationTime: number;
}

export interface ImageAnimationOptions {
  aspectRatio?: '16:9' | '9:16';
  resolution?: '720p' | '1080p';
  duration?: 4 | 6 | 8;
}

export interface VideoExtensionOptions {
  aspectRatio?: '16:9' | '9:16';
  resolution?: '720p' | '1080p';
}

export interface ReferenceImage {
  buffer: Buffer;
  description: string;
}

export interface VideoGenerationResult {
  buffer: Buffer;
  url?: string;
  generationTime: number;
}

export class GeminiProvider {
  private ai: GoogleGenAI;
  private apiKey: string;
  private readonly VEO_MODEL = 'veo-3.0-generate-001';
  private readonly VEO_PREVIEW_MODEL = 'veo-3.1-generate-preview';
  private readonly NANO_BANANA_MODEL = 'gemini-2.5-flash-image';
  private readonly VISION_MODEL = 'gemini-2.0-flash';
  private readonly POLL_INTERVAL_MS = 10000;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || '';

    if (!this.apiKey) {
      throw new Error(
        'GEMINI_API_KEY is required. Set it in environment variables or pass to constructor.\n' +
        'Get your API key at: https://aistudio.google.com/app/apikey'
      );
    }

    this.ai = new GoogleGenAI({ apiKey: this.apiKey });
  }

  async generateImage(
    prompt: string,
    options: ImageGenerationOptions = {}
  ): Promise<Buffer[]> {
    const { count = 1 } = options;

    if (count < 1 || count > 8) {
      throw new Error('Count must be between 1 and 8');
    }

    const buffers: Buffer[] = [];

    for (let i = 0; i < count; i++) {
      const response = await this.ai.models.generateContent({
        model: this.NANO_BANANA_MODEL,
        contents: prompt,
        config: {
          responseModalities: ['image', 'text'],
        },
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            const buffer = Buffer.from(part.inlineData.data, 'base64');
            buffers.push(buffer);
          }
        }
      }
    }

    if (buffers.length === 0) {
      throw new Error('No images were generated');
    }

    return buffers;
  }

  async generateImageSingle(
    prompt: string,
    _options: ImageGenerationOptions = {}
  ): Promise<ImageGenerationResult> {
    const startTime = Date.now();

    const response = await this.ai.models.generateContent({
      model: this.NANO_BANANA_MODEL,
      contents: prompt,
      config: {
        responseModalities: ['image', 'text'],
      },
    });

    if (!response.candidates?.[0]?.content?.parts) {
      throw new Error('No image was generated');
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData?.data) {
        const buffer = Buffer.from(part.inlineData.data, 'base64');
        const generationTime = Date.now() - startTime;
        return {
          buffer,
          mimeType: part.inlineData.mimeType || 'image/png',
          generationTime,
        };
      }
    }

    throw new Error('No image data in response');
  }

  async editImage(
    imageBuffer: Buffer,
    prompt: string,
    _options: ImageEditOptions = {}
  ): Promise<Buffer> {
    const base64Image = imageBuffer.toString('base64');
    const mimeType = this.detectImageMimeType(imageBuffer);

    const result = await this.ai.models.generateContent({
      model: this.NANO_BANANA_MODEL,
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
              text: prompt
            }
          ]
        }
      ],
      config: {
        responseModalities: ['image', 'text'],
      },
    });

    if (result.candidates?.[0]?.content?.parts) {
      for (const part of result.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          return Buffer.from(part.inlineData.data, 'base64');
        }
      }
    }

    throw new Error('No edited image was returned');
  }

  async analyzeImage(
    imageBuffer: Buffer,
    question: string = 'Describe this image in detail'
  ): Promise<string> {
    const base64Image = imageBuffer.toString('base64');
    const mimeType = this.detectImageMimeType(imageBuffer);

    const result = await this.ai.models.generateContent({
      model: this.VISION_MODEL,
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

    if (result?.candidates?.[0]?.content?.parts) {
      const texts: string[] = [];
      for (const part of result.candidates[0].content.parts) {
        if (part.text) {
          texts.push(part.text);
        }
      }
      if (texts.length > 0) {
        return texts.join('\n');
      }
    }

    throw new Error('No analysis result returned');
  }

  async analyzeMultipleImages(
    imageBuffers: Buffer[],
    question: string = 'Compare and describe these images in detail'
  ): Promise<string> {
    const parts: Array<{ inlineData: { data: string; mimeType: string } } | { text: string }> = [];

    for (const imageBuffer of imageBuffers) {
      const base64Image = imageBuffer.toString('base64');
      const mimeType = this.detectImageMimeType(imageBuffer);
      parts.push({
        inlineData: {
          data: base64Image,
          mimeType
        }
      });
    }

    parts.push({ text: question });

    const result = await this.ai.models.generateContent({
      model: this.VISION_MODEL,
      contents: [{ parts }]
    });

    if (result?.candidates?.[0]?.content?.parts) {
      const texts: string[] = [];
      for (const part of result.candidates[0].content.parts) {
        if (part.text) {
          texts.push(part.text);
        }
      }
      if (texts.length > 0) {
        return texts.join('\n');
      }
    }

    throw new Error('No analysis result returned');
  }

  async generateVideo(
    prompt: string,
    options: VideoGenerationOptions = {}
  ): Promise<VideoGenerationResult> {
    const startTime = Date.now();

    const {
      aspectRatio = '16:9',
      resolution = '720p',
      duration = 8,
      numberOfVideos = 1,
      negativePrompt,
    } = options;

    let operation = await this.ai.models.generateVideos({
      model: this.VEO_MODEL,
      prompt,
      config: {
        numberOfVideos,
        aspectRatio,
        resolution,
        durationSeconds: duration,
        ...(negativePrompt && { negativePrompt }),
      },
    });

    operation = await this.pollOperation(operation);

    if (!operation.response?.generatedVideos?.[0]) {
      throw new Error('No video was generated');
    }

    const video = operation.response.generatedVideos[0];
    const videoUrl = video.video?.uri;

    if (!videoUrl) {
      throw new Error('Video URL not available');
    }

    const buffer = await this.downloadVideo(videoUrl);
    const generationTime = Date.now() - startTime;

    return { buffer, url: videoUrl, generationTime };
  }

  async animateImage(
    imageBuffer: Buffer,
    prompt: string,
    options: ImageAnimationOptions = {}
  ): Promise<VideoGenerationResult> {
    const startTime = Date.now();

    const {
      aspectRatio = '16:9',
      resolution = '720p',
      duration = 8,
    } = options;

    const imageBase64 = imageBuffer.toString('base64');
    const mimeType = this.detectImageMimeType(imageBuffer);

    let operation = await this.ai.models.generateVideos({
      model: this.VEO_MODEL,
      prompt,
      image: {
        imageBytes: imageBase64,
        mimeType,
      },
      config: {
        numberOfVideos: 1,
        aspectRatio,
        resolution,
        durationSeconds: duration,
      },
    });

    operation = await this.pollOperation(operation);

    if (!operation.response?.generatedVideos?.[0]) {
      throw new Error('No video was generated from image');
    }

    const video = operation.response.generatedVideos[0];
    const videoUrl = video.video?.uri;

    if (!videoUrl) {
      throw new Error('Video URL not available');
    }

    const buffer = await this.downloadVideo(videoUrl);
    const generationTime = Date.now() - startTime;

    return { buffer, url: videoUrl, generationTime };
  }

  async extendVideo(
    videoBuffer: Buffer,
    prompt: string,
    options: VideoExtensionOptions = {}
  ): Promise<VideoGenerationResult> {
    const startTime = Date.now();

    const {
      aspectRatio = '16:9',
      resolution = '720p',
    } = options;

    const videoBase64 = videoBuffer.toString('base64');

    let operation = await this.ai.models.generateVideos({
      model: this.VEO_MODEL,
      prompt,
      video: {
        videoBytes: videoBase64,
        mimeType: 'video/mp4',
      },
      config: {
        numberOfVideos: 1,
        aspectRatio,
        resolution,
      },
    });

    operation = await this.pollOperation(operation);

    if (!operation.response?.generatedVideos?.[0]) {
      throw new Error('Video extension failed');
    }

    const video = operation.response.generatedVideos[0];
    const videoUrl = video.video?.uri;

    if (!videoUrl) {
      throw new Error('Video URL not available');
    }

    const buffer = await this.downloadVideo(videoUrl);
    const generationTime = Date.now() - startTime;

    return { buffer, url: videoUrl, generationTime };
  }

  async generateVideoWithReferences(
    prompt: string,
    referenceImages: ReferenceImage[],
    options: VideoGenerationOptions = {}
  ): Promise<VideoGenerationResult> {
    if (referenceImages.length === 0 || referenceImages.length > 3) {
      throw new Error('Reference images must be between 1 and 3');
    }

    const startTime = Date.now();

    const {
      aspectRatio = '16:9',
      resolution = '720p',
      duration = 8,
      numberOfVideos = 1,
    } = options;

    const references = referenceImages.map((ref) => ({
      image: {
        imageBytes: ref.buffer.toString('base64'),
        mimeType: this.detectImageMimeType(ref.buffer),
      },
    }));

    let operation = await this.ai.models.generateVideos({
      model: this.VEO_PREVIEW_MODEL,
      prompt,
      config: {
        numberOfVideos,
        aspectRatio,
        resolution,
        durationSeconds: duration,
        referenceImages: references,
      },
    });

    operation = await this.pollOperation(operation);

    if (!operation.response?.generatedVideos?.[0]) {
      console.error('Operation response:', JSON.stringify(operation, null, 2));
      throw new Error('No video was generated with references');
    }

    const video = operation.response.generatedVideos[0];
    const videoUrl = video.video?.uri;

    if (!videoUrl) {
      throw new Error('Video URL not available');
    }

    const buffer = await this.downloadVideo(videoUrl);
    const generationTime = Date.now() - startTime;

    return { buffer, url: videoUrl, generationTime };
  }

  private async pollOperation(operation: ReturnType<typeof this.ai.models.generateVideos> extends Promise<infer T> ? T : never): Promise<typeof operation> {
    let currentOperation = operation;

    while (!currentOperation.done) {
      await new Promise((resolve) => setTimeout(resolve, this.POLL_INTERVAL_MS));
      currentOperation = await this.ai.operations.getVideosOperation({
        operation: currentOperation,
      });
    }

    return currentOperation;
  }

  private async downloadVideo(url: string): Promise<Buffer> {
    const response = await fetch(url, {
      headers: {
        'x-goog-api-key': this.apiKey,
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  private detectImageMimeType(buffer: Buffer): string {
    if (buffer[0] === 0xff && buffer[1] === 0xd8) {
      return 'image/jpeg';
    }
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      return 'image/png';
    }
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
      return 'image/gif';
    }
    if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
      return 'image/webp';
    }
    return 'image/png';
  }
}
