/**
 * File Handler Utility
 *
 * Handles file operations for images, videos, and assets:
 * - Saving generated images and videos
 * - Loading images from disk
 * - Directory management
 * - Filename sanitization
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync } from 'fs';

/**
 * Save image buffer to disk
 *
 * @param buffer Image data
 * @param outputDir Directory to save to
 * @param prompt Prompt used to generate the image
 * @param index Index for batch generations
 * @returns Path to saved file
 */
export async function saveImage(
  buffer: Buffer,
  outputDir: string,
  prompt: string,
  index: number = 0
): Promise<string> {
  // Ensure output directory exists
  await ensureDirectory(outputDir);

  // Generate filename from prompt
  const baseFilename = generateFilename(prompt);
  const filename = index > 0 ? `${baseFilename}_${index}.png` : `${baseFilename}.png`;

  // Handle duplicate filenames
  const filepath = await getUniqueFilepath(outputDir, filename);

  // Write file
  await fs.writeFile(filepath, buffer);

  return filepath;
}

/**
 * Save video buffer to disk
 *
 * @param buffer Video data
 * @param outputDir Directory to save to (optional)
 * @param prompt Prompt used to generate the video
 * @returns Path to saved file
 */
export async function saveVideo(
  buffer: Buffer,
  outputDir: string | undefined,
  prompt: string
): Promise<string> {
  // Use provided directory or default
  const dir = outputDir || getOutputDir();

  // Ensure output directory exists
  await ensureDirectory(dir);

  // Generate filename from prompt
  const baseFilename = generateFilename(prompt);
  const filename = `${baseFilename}.mp4`;

  // Handle duplicate filenames
  const filepath = await getUniqueFilepath(dir, filename);

  // Write file
  await fs.writeFile(filepath, buffer);

  return filepath;
}

/**
 * Load image from disk
 *
 * @param imagePath Path to image file
 * @returns Image buffer
 */
export async function loadImage(imagePath: string): Promise<Buffer> {
  try {
    const buffer = await fs.readFile(imagePath);
    return buffer;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to load image from ${imagePath}: ${error.message}`);
    }
    throw new Error(`Failed to load image from ${imagePath}`);
  }
}

/**
 * Ensure directory exists, create if not
 *
 * @param dirPath Directory path to ensure
 */
export async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create directory ${dirPath}: ${error.message}`);
    }
    throw new Error(`Failed to create directory ${dirPath}`);
  }
}

/**
 * Generate sanitized filename from prompt
 *
 * @param prompt Text prompt
 * @returns Sanitized filename (without extension)
 */
export function generateFilename(prompt: string): string {
  // Take first 50 characters
  let filename = prompt.substring(0, 50);

  // Replace spaces with underscores
  filename = filename.replace(/\s+/g, '_');

  // Remove special characters except underscores and hyphens
  filename = filename.replace(/[^a-zA-Z0-9_-]/g, '');

  // Convert to lowercase
  filename = filename.toLowerCase();

  // Remove leading/trailing underscores
  filename = filename.replace(/^_+|_+$/g, '');

  // Ensure not empty
  if (!filename) {
    filename = 'image';
  }

  return filename;
}

/**
 * Get output directory from environment or default
 *
 * @returns Output directory path
 */
export function getOutputDir(): string {
  return process.env.OUTPUT_DIR || './generated-assets';
}

/**
 * Get unique filepath by adding incrementing suffix if file exists
 *
 * @param dirPath Directory path
 * @param filename Desired filename
 * @returns Unique filepath
 */
async function getUniqueFilepath(dirPath: string, filename: string): Promise<string> {
  const filepath = path.join(dirPath, filename);

  if (!existsSync(filepath)) {
    return filepath;
  }

  // File exists, add incrementing suffix
  const ext = path.extname(filename);
  const basename = path.basename(filename, ext);

  let counter = 1;
  let uniqueFilepath = path.join(dirPath, `${basename}_${counter}${ext}`);

  while (existsSync(uniqueFilepath)) {
    counter++;
    uniqueFilepath = path.join(dirPath, `${basename}_${counter}${ext}`);
  }

  return uniqueFilepath;
}
