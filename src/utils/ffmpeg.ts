/**
 * FFmpeg Utility Module
 *
 * Provides video processing operations using FFmpeg
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';

const execAsync = promisify(exec);

export interface ConcatenateOptions {
  transition?: 'cut' | 'crossfade' | 'fade';
  transitionDuration?: number;
}

/**
 * Check if FFmpeg is installed and available
 */
export async function checkFfmpegInstalled(): Promise<boolean> {
  try {
    await execAsync('ffmpeg -version');
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the duration of a video in seconds
 */
export async function getVideoDuration(videoPath: string): Promise<number> {
  if (!existsSync(videoPath)) {
    throw new Error(`Video file not found: ${videoPath}`);
  }

  try {
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`
    );
    const duration = parseFloat(stdout.trim());
    if (isNaN(duration)) {
      throw new Error(`Failed to parse video duration: ${stdout}`);
    }
    return duration;
  } catch (error) {
    throw new Error(`Failed to get video duration: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Trim a video from startTime for the specified duration
 */
export async function trimVideo(
  videoPath: string,
  startTime: number,
  duration: number,
  outputPath: string
): Promise<void> {
  if (!existsSync(videoPath)) {
    throw new Error(`Video file not found: ${videoPath}`);
  }

  if (startTime < 0 || duration <= 0) {
    throw new Error(`Invalid trim parameters: startTime=${startTime}, duration=${duration}`);
  }

  try {
    await execAsync(
      `ffmpeg -i "${videoPath}" -ss ${startTime} -t ${duration} -c copy "${outputPath}" -y`
    );
  } catch (error) {
    throw new Error(`Failed to trim video: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Add an audio track to a video
 */
export async function addAudioTrack(
  videoPath: string,
  audioPath: string,
  outputPath: string,
  volume: number = 1.0
): Promise<void> {
  if (!existsSync(videoPath)) {
    throw new Error(`Video file not found: ${videoPath}`);
  }

  if (!existsSync(audioPath)) {
    throw new Error(`Audio file not found: ${audioPath}`);
  }

  if (volume < 0 || volume > 1) {
    throw new Error(`Volume must be between 0 and 1, got: ${volume}`);
  }

  try {
    // Mix video audio with background audio, adjust volume of background
    await execAsync(
      `ffmpeg -i "${videoPath}" -i "${audioPath}" -filter_complex "[1:a]volume=${volume}[a1];[0:a][a1]amix=inputs=2:duration=first[aout]" -map 0:v -map "[aout]" -c:v copy -c:a aac "${outputPath}" -y`
    );
  } catch (error) {
    throw new Error(`Failed to add audio track: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Concatenate multiple videos with transitions
 */
export async function concatenateVideos(
  videoPaths: string[],
  outputPath: string,
  options: ConcatenateOptions = {}
): Promise<void> {
  if (videoPaths.length === 0) {
    throw new Error('No videos provided for concatenation');
  }

  // Check all input files exist
  for (const videoPath of videoPaths) {
    if (!existsSync(videoPath)) {
      throw new Error(`Video file not found: ${videoPath}`);
    }
  }

  const { transition = 'crossfade', transitionDuration = 0.5 } = options;

  try {
    if (transition === 'cut') {
      // Simple concatenation without transitions
      await concatenateWithCut(videoPaths, outputPath);
    } else if (transition === 'crossfade') {
      // Crossfade transition between videos
      await concatenateWithCrossfade(videoPaths, outputPath, transitionDuration);
    } else if (transition === 'fade') {
      // Fade to black transition between videos
      await concatenateWithFade(videoPaths, outputPath, transitionDuration);
    } else {
      throw new Error(`Unknown transition type: ${transition}`);
    }
  } catch (error) {
    throw new Error(`Failed to concatenate videos: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Concatenate videos with simple cut (no transition)
 */
async function concatenateWithCut(videoPaths: string[], outputPath: string): Promise<void> {
  // Create a temporary concat file
  const concatListPath = outputPath + '.concat.txt';
  const fs = await import('fs/promises');

  const concatContent = videoPaths.map(path => `file '${path}'`).join('\n');
  await fs.writeFile(concatListPath, concatContent);

  try {
    await execAsync(
      `ffmpeg -f concat -safe 0 -i "${concatListPath}" -c copy "${outputPath}" -y`
    );
  } finally {
    // Clean up concat file
    await fs.unlink(concatListPath).catch(() => {});
  }
}

async function concatenateWithCrossfade(
  videoPaths: string[],
  outputPath: string,
  transitionDuration: number
): Promise<void> {
  if (videoPaths.length === 1) {
    const fs = await import('fs/promises');
    const firstVideo = videoPaths[0];
    if (!firstVideo) {
      throw new Error('No video path provided');
    }
    await fs.copyFile(firstVideo, outputPath);
    return;
  }

  const durations: number[] = [];
  for (const videoPath of videoPaths) {
    const dur = await getVideoDuration(videoPath);
    durations.push(dur);
  }

  let filterComplex = '';
  let audioFilterComplex = '';
  let currentVideoLabel = '[0:v]';
  let currentAudioLabel = '[0:a]';
  let cumulativeOffset = durations[0]! - transitionDuration;

  for (let i = 1; i < videoPaths.length; i++) {
    const isLast = i === videoPaths.length - 1;
    const nextVideoLabel = isLast ? '[outv]' : `[v${i}]`;
    const nextAudioLabel = isLast ? '[outa]' : `[a${i}]`;
    
    filterComplex += `${currentVideoLabel}[${i}:v]xfade=transition=fade:duration=${transitionDuration}:offset=${cumulativeOffset}${nextVideoLabel};`;
    audioFilterComplex += `${currentAudioLabel}[${i}:a]acrossfade=d=${transitionDuration}${nextAudioLabel};`;
    
    currentVideoLabel = nextVideoLabel;
    currentAudioLabel = nextAudioLabel;
    
    if (!isLast) {
      cumulativeOffset += durations[i]! - transitionDuration;
    }
  }

  const fullFilter = filterComplex + audioFilterComplex.slice(0, -1);
  const inputs = videoPaths.map(path => `-i "${path}"`).join(' ');

  await execAsync(
    `ffmpeg ${inputs} -filter_complex "${fullFilter}" -map "[outv]" -map "[outa]" "${outputPath}" -y`
  );
}

/**
 * Concatenate videos with fade to black transition
 */
async function concatenateWithFade(
  videoPaths: string[],
  outputPath: string,
  duration: number
): Promise<void> {
  if (videoPaths.length === 1) {
    // No transition needed for single video
    const fs = await import('fs/promises');
    const firstVideo = videoPaths[0];
    if (!firstVideo) {
      throw new Error('No video path provided');
    }
    await fs.copyFile(firstVideo, outputPath);
    return;
  }

  // For fade transition, we fade out each clip and fade in the next
  // This is complex with FFmpeg, using a simpler concatenation approach
  const inputs = videoPaths.map(path => `-i "${path}"`).join(' ');

  // Build filter to fade out and fade in
  let filterComplex = '';
  for (let i = 0; i < videoPaths.length; i++) {
    if (i < videoPaths.length - 1) {
      // Fade out at the end of each video except the last
      filterComplex += `[${i}:v]fade=t=out:st=0:d=${duration}[v${i}out];`;
      // Fade in at the start of next video
      filterComplex += `[${i + 1}:v]fade=t=in:st=0:d=${duration}[v${i + 1}in];`;
    }
  }

  // Concatenate the faded segments
  const concatInputs = videoPaths.map((_, i) => {
    if (i === 0) return '[v0out]';
    if (i === videoPaths.length - 1) return `[v${i}in]`;
    return `[v${i}out][v${i}in]`;
  }).join('');

  filterComplex += `${concatInputs}concat=n=${videoPaths.length}:v=1:a=0[outv]`;

  await execAsync(
    `ffmpeg ${inputs} -filter_complex "${filterComplex}" -map "[outv]" "${outputPath}" -y`
  );
}
