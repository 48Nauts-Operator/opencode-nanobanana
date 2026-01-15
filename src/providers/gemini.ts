/**
 * Gemini Provider for Video Generation using Veo 3.1
 *
 * This provider wraps the Google GenAI SDK to provide a clean API
 * for video generation with native audio support, resolution control,
 * and duration options.
 */

import { GoogleGenAI, VideoGenerationReferenceType } from '@google/genai';

export interface VideoGenerationOptions {
  /** Aspect ratio for the video */
  aspectRatio?: '16:9' | '9:16' | '1:1';
  /** Video resolution (default: 720p) */
  resolution?: '720p' | '1080p';
  /** Video duration in seconds (default: 8) */
  duration?: 4 | 6 | 8;
  /** Enable native audio generation (default: true) */
  generateAudio?: boolean;
  /** Number of videos to generate (default: 1) */
  numberOfVideos?: number;
}

export interface ImageAnimationOptions {
  /** Aspect ratio for the video */
  aspectRatio?: '16:9' | '9:16' | '1:1';
  /** Video resolution (default: 720p) */
  resolution?: '720p' | '1080p';
  /** Video duration in seconds (default: 8) */
  duration?: 4 | 6 | 8;
  /** Enable native audio generation (default: true) */
  generateAudio?: boolean;
}

export interface VideoExtensionOptions {
  /** Aspect ratio for the video */
  aspectRatio?: '16:9' | '9:16' | '1:1';
  /** Video resolution (default: 720p) */
  resolution?: '720p' | '1080p';
}

export interface ReferenceImage {
  /** Image buffer */
  buffer: Buffer;
  /** Description of what the reference image represents */
  description: string;
}

export interface VideoGenerationResult {
  /** Video buffer */
  buffer: Buffer;
  /** Video URL (temporary) */
  url?: string;
  /** Generation time in milliseconds */
  generationTime: number;
}

export class GeminiProvider {
  private ai: GoogleGenAI;
  private readonly VEO_3_1_MODEL = 'veo-3.1-generate-001';
  private readonly POLL_INTERVAL_MS = 10000; // 10 seconds

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  /**
   * Generate a video from a text prompt using Veo 3.1
   *
   * @param prompt Text description of the video to generate
   * @param options Video generation options
   * @returns Video buffer and metadata
   */
  async generateVideo(
    prompt: string,
    options: VideoGenerationOptions = {}
  ): Promise<VideoGenerationResult> {
    const startTime = Date.now();

    const {
      aspectRatio = '16:9',
      resolution = '720p',
      duration = 8,
      generateAudio = true,
      numberOfVideos = 1,
    } = options;

    // Start video generation operation
    let operation = await this.ai.models.generateVideos({
      model: this.VEO_3_1_MODEL,
      prompt,
      config: {
        numberOfVideos,
        aspectRatio,
        resolution,
        durationSeconds: duration,
        generateAudio,
      },
    });

    // Poll for completion
    operation = await this.pollOperation(operation);

    // Extract video
    if (!operation.response?.generatedVideos?.[0]) {
      throw new Error('No video was generated');
    }

    const video = operation.response.generatedVideos[0];
    const videoUrl = video.video?.uri;

    if (!videoUrl) {
      throw new Error('Video URL not available');
    }

    // Download video
    const buffer = await this.downloadVideo(videoUrl);
    const generationTime = Date.now() - startTime;

    return {
      buffer,
      url: videoUrl,
      generationTime,
    };
  }

  /**
   * Animate an image using Veo 3.1
   *
   * @param imageBuffer Image to animate
   * @param prompt Text description of the animation
   * @param options Animation options
   * @returns Video buffer and metadata
   */
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
      generateAudio = true,
    } = options;

    // Convert buffer to base64
    const imageBase64 = imageBuffer.toString('base64');
    const mimeType = this.detectImageMimeType(imageBuffer);

    // Start image animation operation
    let operation = await this.ai.models.generateVideos({
      model: this.VEO_3_1_MODEL,
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
        generateAudio,
      },
    });

    // Poll for completion
    operation = await this.pollOperation(operation);

    // Extract video
    if (!operation.response?.generatedVideos?.[0]) {
      throw new Error('No video was generated from image');
    }

    const video = operation.response.generatedVideos[0];
    const videoUrl = video.video?.uri;

    if (!videoUrl) {
      throw new Error('Video URL not available');
    }

    // Download video
    const buffer = await this.downloadVideo(videoUrl);
    const generationTime = Date.now() - startTime;

    return {
      buffer,
      url: videoUrl,
      generationTime,
    };
  }

  /**
   * Extend an existing video with new content using Veo 3.1
   *
   * @param videoBuffer Existing video to extend
   * @param prompt Description of the extension content
   * @param options Extension options
   * @returns Extended video buffer and metadata
   */
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

    // Convert buffer to base64
    const videoBase64 = videoBuffer.toString('base64');

    // Start video extension operation
    let operation = await this.ai.models.generateVideos({
      model: this.VEO_3_1_MODEL,
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

    // Poll for completion
    operation = await this.pollOperation(operation);

    // Extract video
    if (!operation.response?.generatedVideos?.[0]) {
      throw new Error('Video extension failed');
    }

    const video = operation.response.generatedVideos[0];
    const videoUrl = video.video?.uri;

    if (!videoUrl) {
      throw new Error('Video URL not available');
    }

    // Download video
    const buffer = await this.downloadVideo(videoUrl);
    const generationTime = Date.now() - startTime;

    return {
      buffer,
      url: videoUrl,
      generationTime,
    };
  }

  /**
   * Generate video with reference images for consistency
   *
   * @param prompt Text description of the video
   * @param referenceImages Array of reference images (max 3)
   * @param options Video generation options
   * @returns Video buffer and metadata
   */
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
      generateAudio = true,
      numberOfVideos = 1,
    } = options;

    // Prepare reference images
    const references = referenceImages.map((ref) => ({
      image: {
        imageBytes: ref.buffer.toString('base64'),
        mimeType: this.detectImageMimeType(ref.buffer),
      },
      referenceType: VideoGenerationReferenceType.ASSET,
    }));

    // Start video generation with references
    let operation = await this.ai.models.generateVideos({
      model: this.VEO_3_1_MODEL,
      prompt,
      config: {
        numberOfVideos,
        aspectRatio,
        resolution,
        durationSeconds: duration,
        generateAudio,
        referenceImages: references,
      },
    });

    // Poll for completion
    operation = await this.pollOperation(operation);

    // Extract video
    if (!operation.response?.generatedVideos?.[0]) {
      throw new Error('No video was generated with references');
    }

    const video = operation.response.generatedVideos[0];
    const videoUrl = video.video?.uri;

    if (!videoUrl) {
      throw new Error('Video URL not available');
    }

    // Download video
    const buffer = await this.downloadVideo(videoUrl);
    const generationTime = Date.now() - startTime;

    return {
      buffer,
      url: videoUrl,
      generationTime,
    };
  }

  /**
   * Poll for operation completion
   */
  private async pollOperation(operation: any): Promise<any> {
    let currentOperation = operation;

    while (!currentOperation.done) {
      await new Promise((resolve) => setTimeout(resolve, this.POLL_INTERVAL_MS));
      currentOperation = await this.ai.operations.getVideosOperation({
        operation: currentOperation,
      });
    }

    return currentOperation;
  }

  /**
   * Download video from URL
   */
  private async downloadVideo(url: string): Promise<Buffer> {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Detect image MIME type from buffer
   */
  private detectImageMimeType(buffer: Buffer): string {
    // Check magic numbers
    if (buffer[0] === 0xff && buffer[1] === 0xd8) {
      return 'image/jpeg';
    }
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      return 'image/png';
    }
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
      return 'image/gif';
    }
    if (
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46
    ) {
      return 'image/webp';
    }

    // Default to PNG
    return 'image/png';
  }
}
