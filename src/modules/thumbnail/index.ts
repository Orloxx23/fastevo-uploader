/**
 * @file Video Thumbnail Generator
 * @description Utilities for generating thumbnails from video files using native and FFmpeg methods
 */

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { CapturedFrame, Thumbnail, ThumbnailOptions } from "./types";

let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoading: Promise<FFmpeg> | null = null;

/**
 * Lazy-load FFmpeg.wasm and use a CDN worker URL to bypass bundler processing.
 */
async function loadFFmpeg(silent = false): Promise<FFmpeg> {
  if (ffmpegLoading) return ffmpegLoading;
  if (ffmpegInstance) return ffmpegInstance;

  ffmpegLoading = (async () => {
    try {
      ffmpegInstance = new FFmpeg();

      // Optional UI update
      const ffmpegStatusEl = document.getElementById("ffmpegStatus");
      if (ffmpegStatusEl) {
        ffmpegStatusEl.className = "ffmpeg-status loading";
        ffmpegStatusEl.title = "FFmpeg loading...";
      }
      let statusEl: HTMLElement | null = null;
      let originalStatus: string | null = null;
      if (!silent) {
        statusEl = document.getElementById("status");
        originalStatus = statusEl ? statusEl.textContent : null;
        if (statusEl) statusEl.textContent = "Loading FFmpeg.wasm...";
      }

      await ffmpegInstance.load();

      if (ffmpegInstance.loaded) {
        console.log("FFmpeg loaded");
      } else {
        console.error("FFmpeg failed to load");
        throw new Error("FFmpeg failed to load");
      }

      if (ffmpegStatusEl) {
        ffmpegStatusEl.className = "ffmpeg-status loaded";
        ffmpegStatusEl.title = "FFmpeg loaded";
      }
      if (!silent && statusEl && originalStatus !== null) {
        statusEl.textContent = originalStatus;
      }

      return ffmpegInstance;
    } catch (err: any) {
      ffmpegLoading = null;
      ffmpegInstance = null;
      const ffmpegStatusEl = document.getElementById("ffmpegStatus");
      if (ffmpegStatusEl) {
        ffmpegStatusEl.className = "ffmpeg-status";
        ffmpegStatusEl.title = "FFmpeg not loaded";
      }
      throw new Error(
        "Failed to load FFmpeg.wasm: " +
          (err instanceof Error ? err.message : err)
      );
    }
  })();

  return ffmpegLoading;
}

export async function preloadFFmpeg(): Promise<boolean> {
  try {
    await loadFFmpeg(true);
    return true;
  } catch (err) {
    console.warn("FFmpeg preloading failed:", err);
    return false;
  }
}

async function getVideoDuration(videoFile: File | Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const tempVideo = document.createElement("video");
    tempVideo.preload = "metadata";

    const objectUrl = URL.createObjectURL(videoFile);
    tempVideo.src = objectUrl;

    const timeout = setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Timed out while loading video metadata."));
    }, 5000);

    tempVideo.onloadedmetadata = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(objectUrl);
      resolve(tempVideo.duration);
    };

    tempVideo.onerror = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load video metadata."));
    };
  });
}

async function captureFrameAtTime(
  video: HTMLVideoElement,
  time: number,
  format: "png" | "jpg" = "png"
): Promise<CapturedFrame> {
  const mimeType = format === "jpg" ? "image/jpeg" : "image/png";

  return new Promise((resolve, reject) => {
    let timeoutId: number | null = null;

    function captureFrame() {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Unable to get canvas context."));
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      } catch (e: any) {
        return reject(new Error("Error drawing video frame: " + e.message));
      }
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({
              blob,
              canvas,
              timestamp: time,
              width: canvas.width,
              height: canvas.height,
            });
          } else {
            reject(new Error("Canvas failed to produce blob."));
          }
        },
        mimeType,
        format === "jpg" ? 0.9 : undefined
      );
    }

    const onSeeked = () => {
      if (timeoutId) clearTimeout(timeoutId);
      video.removeEventListener("seeked", onSeeked);
      captureFrame();
    };

    video.addEventListener("seeked", onSeeked);
    timeoutId = window.setTimeout(() => {
      video.removeEventListener("seeked", onSeeked);
      if (video.readyState >= 2) {
        captureFrame();
      } else {
        reject(
          new Error("Seeked event did not fire in time and video is not ready.")
        );
      }
    }, 2000);

    video.currentTime = time;
  });
}

function isCanvasMostlyBlack(
  canvas: HTMLCanvasElement,
  threshold = 10
): boolean {
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;
  const { width, height } = canvas;
  const sampleSize = Math.min(100, Math.floor((width * height) / 1000));
  const sampleWidth = Math.floor(width / Math.sqrt(sampleSize));
  const sampleHeight = Math.floor(height / Math.sqrt(sampleSize));

  let total = 0;
  let count = 0;

  for (let y = 0; y < height; y += sampleHeight) {
    for (let x = 0; x < width; x += sampleWidth) {
      const data = ctx.getImageData(x, y, 1, 1).data;
      total += (data[0] + data[1] + data[2]) / 3;
      count++;
    }
  }
  return total / count < threshold;
}

async function generateThumbnailsWithVideo(
  videoFile: File | Blob,
  duration: number,
  options: ThumbnailOptions = {}
): Promise<Thumbnail[]> {
  const { numSnapshots = 5, format = "png", thumbnailInterval = 5 } = options;
  const snapshotTimes = calculateSnapshotTimes(
    duration,
    numSnapshots,
    thumbnailInterval
  );
  const thumbnails: Thumbnail[] = [];
  const snapshotBlackFlags: boolean[] = [];

  const video = document.createElement("video");
  video.preload = "auto";
  video.muted = true;
  video.playsInline = true;

  const videoUrl = URL.createObjectURL(videoFile);
  video.src = videoUrl;

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Video element failed to load (timeout)."));
    }, 10000);

    video.onloadedmetadata = () => {
      clearTimeout(timeout);
      resolve();
    };

    video.onerror = () => {
      clearTimeout(timeout);
      reject(new Error("Video element failed to load."));
    };
  });

  try {
    await video.play();
    video.pause();
  } catch (err) {
    // Ignore play errors
  }

  // Prime the video by seeking to a dummy time
  if (snapshotTimes.length > 0) {
    try {
      const dummyTime = Math.min(0.5, duration * 0.1);
      await new Promise<void>((resolve) => {
        const onSeeked = () => {
          video.removeEventListener("seeked", onSeeked);
          resolve();
        };
        video.addEventListener("seeked", onSeeked);
        video.currentTime = dummyTime;
      });
    } catch (err) {
      // Ignore priming errors
    }
  }

  for (const time of snapshotTimes) {
    try {
      const result = await captureFrameAtTime(video, time, format);
      const isBlack = isCanvasMostlyBlack(result.canvas);
      snapshotBlackFlags.push(isBlack);

      const blob = result.blob;
      const blobUrl = URL.createObjectURL(blob);

      thumbnails.push({
        blobUrl,
        blob,
        arrayBuffer: await blob.arrayBuffer(),
        timestamp: time,
        videoDuration: duration,
        width: result.width,
        height: result.height,
        isBlack,
        method: "native",
      });
    } catch (err) {
      console.warn(`Failed to capture frame at ${time} seconds:`, err);
    }
  }

  URL.revokeObjectURL(videoUrl);

  if (snapshotBlackFlags.every((flag) => flag)) {
    throw new Error(
      "All captured frames are mostly black. Trying FFmpeg method."
    );
  }

  return thumbnails;
}

async function generateThumbnailsWithFFmpeg(
  videoFile: File | Blob,
  options: ThumbnailOptions = {}
): Promise<Thumbnail[]> {
  const { numSnapshots = 5, format = "png", thumbnailInterval = 5 } = options;
  if (format !== "png" && format !== "jpg") {
    throw new Error("Invalid format. Only 'png' and 'jpg' are supported.");
  }

  const ffmpeg = await loadFFmpeg();

  let duration: number;
  try {
    duration = await getVideoDuration(videoFile);
  } catch (err) {
    console.warn("Failed to determine video duration:", err);
    duration = 60;
  }

  const snapshotTimes = calculateSnapshotTimes(
    duration,
    numSnapshots,
    thumbnailInterval
  );
  const fileExtension =
    "name" in videoFile && videoFile.name.includes(".")
      ? videoFile.name.substring(videoFile.name.lastIndexOf("."))
      : ".mp4";
  const inputFileName = `input_video${fileExtension}`;

  try {
    await ffmpeg.writeFile(inputFileName, await fetchFile(videoFile));
  } catch (err: any) {
    throw new Error(
      "Failed to write video file to FFmpeg: " +
        (err instanceof Error ? err.message : err)
    );
  }

  const thumbnails: Thumbnail[] = [];

  for (let i = 0; i < snapshotTimes.length; i++) {
    const timeStr = snapshotTimes[i].toString();
    const outputFileName = `thumbnail_${i}.${format}`;

    try {
      await ffmpeg.exec([
        "-ss",
        timeStr,
        "-i",
        inputFileName,
        "-frames:v",
        "1",
        "-q:v",
        "2",
        outputFileName,
      ]);

      const fileData = await ffmpeg.readFile(outputFileName);
      const mimeType = format === "png" ? "image/png" : "image/jpeg";
      const arrayBuffer =
        fileData instanceof Uint8Array
          ? fileData.buffer
          : new TextEncoder().encode(fileData).buffer;
      const safeArrayBuffer = new Uint8Array(arrayBuffer).slice().buffer;
      const blob = new Blob([safeArrayBuffer], { type: mimeType });
      const blobUrl = URL.createObjectURL(blob);

      thumbnails.push({
        blobUrl,
        blob,
        arrayBuffer: safeArrayBuffer,
        timestamp: snapshotTimes[i],
        videoDuration: duration,
        method: "ffmpeg",
      });

      await ffmpeg.deleteFile(outputFileName);
    } catch (err) {
      console.error(`Failed to generate thumbnail at ${timeStr} seconds:`, err);
    }
  }

  try {
    await ffmpeg.deleteFile(inputFileName);
  } catch (err) {
    console.warn("Failed to clean up input file:", err);
  }

  return thumbnails;
}

export async function isValidVideoFile(file: File | Blob): Promise<boolean> {
  const headerBytes = await readFileHeader(file, 12);
  const videoSignatures: { format: string; signature: number[] }[] = [
    {
      format: "MP4",
      signature: [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70],
    },
    {
      format: "MP4 ISO",
      signature: [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70],
    },
    {
      format: "MP4 Variant",
      signature: [0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d],
    },
    {
      format: "MP4 Variant",
      signature: [0x66, 0x74, 0x79, 0x70, 0x6d, 0x70, 0x34, 0x32],
    },
    { format: "WEBM", signature: [0x1a, 0x45, 0xdf, 0xa3] },
    { format: "AVI", signature: [0x52, 0x49, 0x46, 0x46] },
    { format: "FLV", signature: [0x46, 0x4c, 0x56, 0x01] },
    {
      format: "MOV",
      signature: [0x66, 0x74, 0x79, 0x70, 0x71, 0x74, 0x20, 0x20],
    },
    { format: "3GP", signature: [0x66, 0x74, 0x79, 0x70, 0x33, 0x67, 0x70] },
    {
      format: "MKV",
      signature: [0x1a, 0x45, 0xdf, 0xa3, 0x93, 0x42, 0x82, 0x88],
    },
  ];

  const fileHeader = new Uint8Array(headerBytes);
  for (const { format, signature } of videoSignatures) {
    if (format.includes("MP4 Variant")) {
      let isMatch = true;
      for (let i = 0; i < signature.length; i++) {
        if (fileHeader[4 + i] !== signature[i]) {
          isMatch = false;
          break;
        }
      }
      if (isMatch) {
        console.log(`Detected video format: ${format}`);
        return true;
      }
    } else {
      let isMatch = true;
      for (let i = 0; i < signature.length; i++) {
        if (fileHeader[i] !== signature[i]) {
          isMatch = false;
          break;
        }
      }
      if (isMatch) {
        console.log(`Detected video format: ${format}`);
        return true;
      }
    }
  }
  return file.type.startsWith("video/");
}

async function readFileHeader(
  file: File | Blob,
  length: number
): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onloadend = (e) => {
      resolve(e.target!.result as ArrayBuffer);
    };
    fileReader.onerror = () => {
      reject(new Error("Error reading file header"));
    };
    const blob = file.slice(0, length);
    fileReader.readAsArrayBuffer(blob);
  });
}

function calculateSnapshotTimes(
  duration: number,
  numSnapshots: number,
  thumbnailInterval = 5
): number[] {
  const totalFrames = Math.floor(duration / thumbnailInterval) + 1;
  const posterCount = Math.min(totalFrames, numSnapshots);
  const step = Math.floor(totalFrames / posterCount);
  const snapshotTimes: number[] = [];

  for (let i = 0; i < posterCount; i++) {
    snapshotTimes.push(i * step * thumbnailInterval);
  }
  console.log("Generated snapshot times:", snapshotTimes);
  return snapshotTimes;
}

export async function generateThumbnails(
  videoFile: File | Blob,
  options: ThumbnailOptions = {}
): Promise<Thumbnail[]> {
  const statusEl = document.getElementById("status");
  const originalStatus = statusEl ? statusEl.textContent : null;
  const updateStatus = (message: string) => {
    if (statusEl) statusEl.textContent = message;
  };

  const { method = "auto", thumbnailInterval = 5 } = options;

  try {
    if (method === "ffmpeg") {
      updateStatus("Generating thumbnails with FFmpeg...");
      try {
        const result = await generateThumbnailsWithFFmpeg(videoFile, options);
        updateStatus(originalStatus || "");
        return result;
      } catch (err: any) {
        console.warn("FFmpeg method failed:", err);
        updateStatus("FFmpeg method failed!");
        throw new Error(
          "FFmpeg method failed: " + (err instanceof Error ? err.message : err)
        );
      }
    }

    let duration: number = 0;
    if (method === "native" || method === "auto") {
      try {
        updateStatus("Getting video metadata...");
        duration = await getVideoDuration(videoFile);
      } catch (err) {
        console.warn("Could not get duration via video element:", err);
        if (method === "auto") {
          updateStatus("Falling back to FFmpeg...");
          const result = await generateThumbnailsWithFFmpeg(videoFile, options);
          updateStatus(originalStatus || "");
          return result;
        } else {
          updateStatus("Native method failed!");
          throw new Error("Native method failed: Could not get video duration");
        }
      }
    }

    if (method === "native") {
      updateStatus("Generating thumbnails with native video...");
      try {
        const result = await generateThumbnailsWithVideo(
          videoFile,
          duration,
          options
        );
        updateStatus(originalStatus || "");
        return result;
      } catch (err: any) {
        console.warn("Native video method failed during processing:", err);
        updateStatus("Native video method failed!");
        throw new Error(
          "Native method failed: " + (err instanceof Error ? err.message : err)
        );
      }
    }

    try {
      updateStatus("Generating thumbnails with native video...");
      const result = await generateThumbnailsWithVideo(
        videoFile,
        duration,
        options
      );
      updateStatus(originalStatus || "");
      return result;
    } catch (err) {
      console.warn(
        "Native method failed in auto mode, falling back to FFmpeg:",
        err
      );
      updateStatus("Auto mode: Falling back to FFmpeg...");
      const result = await generateThumbnailsWithFFmpeg(videoFile, options);
      updateStatus(originalStatus || "");
      return result;
    }
  } finally {
    if (statusEl && originalStatus) statusEl.textContent = originalStatus;
  }
}

export default {
  generateThumbnails,
  isValidVideoFile,
  preloadFFmpeg,
};
