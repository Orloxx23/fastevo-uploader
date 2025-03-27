import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { CapturedFrame, Thumbnail, ThumbnailOptions } from "./types";
import Logger from "../../core/logger/Logger";
import { CustomError } from "../../core/errors";

/**
 * Class responsible for generating thumbnails for videos and images.
 */
class ThumbnailGenerator {
  private ffmpegInstance: FFmpeg | null = null;
  private ffmpegLoading: Promise<FFmpeg> | null = null;
  private logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger || new Logger({ level: "info" });
  }

  /**
   * Preloads FFmpeg to optimize performance.
   * @returns Promise that resolves if FFmpeg loads successfully.
   */
  async preloadFFmpeg(): Promise<boolean> {
    try {
      await this.loadFFmpeg(true);
      return true;
    } catch (err) {
      this.logger.warn("Preloading FFmpeg failed.", { error: err });
      return false;
    }
  }

  /**
   * Generates thumbnails for a video file.
   * @param videoFile - Video file.
   * @param options - Options for thumbnail generation.
   * @returns Promise that resolves with an array of thumbnails.
   */
  async generateThumbnails(
    videoFile: File | Blob,
    options: ThumbnailOptions = {},
  ): Promise<Thumbnail[]> {
    const { method = "auto", ...thumbnailOptions } = options;

    try {
      if (method === "ffmpeg") {
        return await this.generateThumbnailsWithFFmpeg(
          videoFile,
          thumbnailOptions,
        );
      } else if (method === "native") {
        return await this.generateThumbnailsWithVideo(
          videoFile,
          thumbnailOptions,
        );
      } else {
        this.logger.info(
          "Attempting to generate thumbnails using FFmpeg method.",
        );
        const thumbnails = await this.generateThumbnailsWithFFmpeg(
          videoFile,
          thumbnailOptions,
        );
        if (thumbnails.every((thumb) => thumb.isBlack)) {
          this.logger.warn(
            "All FFmpeg method thumbnails are mostly black. Falling back to native method.",
          );
          return await this.generateThumbnailsWithVideo(
            videoFile,
            thumbnailOptions,
          );
        }
        return thumbnails;
      }
    } catch (err) {
      this.logger.warn(
        "Error detected in FFmpeg method. Falling back to native method.",
        { error: err },
      );
      return await this.generateThumbnailsWithVideo(
        videoFile,
        thumbnailOptions,
      );
    }
  }

  // Private method to load FFmpeg
  private async loadFFmpeg(silent = false): Promise<FFmpeg> {
    if (this.ffmpegLoading) return this.ffmpegLoading;
    if (this.ffmpegInstance) return this.ffmpegInstance;

    this.ffmpegLoading = (async () => {
      try {
        this.ffmpegInstance = new FFmpeg();
        await this.ffmpegInstance.load();

        if (this.ffmpegInstance.loaded) {
          this.logger.info("FFmpeg loaded successfully.");
        } else {
          this.logger.error("FFmpeg failed to load.");
          throw new CustomError("FFmpegError", "FFmpeg failed to load.");
        }

        this.ffmpegInstance.on("log", ({ type, message }) => {
          this.logger.info(`FFmpeg [${type}]: ${message}`);
        });

        this.ffmpegInstance.on("progress", ({ progress, time }) => {
          this.logger.info(`FFmpeg progress: ${progress} (${time})`);
        });

        return this.ffmpegInstance;
      } catch (err: any) {
        this.ffmpegLoading = null;
        this.ffmpegInstance = null;
        this.logger.error("Error loading FFmpeg.", { error: err });
        throw new CustomError(
          "FFmpegError",
          `Failed to load FFmpeg: ${err.message}`,
        );
      }
    })();

    return this.ffmpegLoading;
  }

  // Private method to get the video duration
  private async getVideoDuration(videoFile: File | Blob): Promise<number> {
    return new Promise((resolve, reject) => {
      const tempVideo = document.createElement("video");
      tempVideo.preload = "metadata";

      const objectUrl = URL.createObjectURL(videoFile);
      tempVideo.src = objectUrl;

      const timeout = setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
        reject(
          new CustomError(
            "VideoError",
            "Timed out while loading video metadata.",
          ),
        );
      }, 5000);

      tempVideo.onloadedmetadata = () => {
        clearTimeout(timeout);
        URL.revokeObjectURL(objectUrl);
        resolve(tempVideo.duration);
      };

      tempVideo.onerror = () => {
        clearTimeout(timeout);
        URL.revokeObjectURL(objectUrl);
        reject(new CustomError("VideoError", "Failed to load video metadata."));
      };
    });
  }

  // Private method to capture a frame at a specific timestamp
  private async captureFrameAtTime(
    video: HTMLVideoElement,
    time: number,
    format: "png" | "jpg" = "png",
  ): Promise<CapturedFrame> {
    const mimeType = format === "jpg" ? "image/jpeg" : "image/png";

    return new Promise((resolve, reject) => {
      let timeoutId: number | null = null;

      function captureFrame() {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx)
          return reject(
            new CustomError("CanvasError", "Unable to get canvas context."),
          );
        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        } catch (e: any) {
          return reject(
            new CustomError(
              "CanvasError",
              `Error drawing video frame: ${e.message}`,
            ),
          );
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
              reject(
                new CustomError("BlobError", "Canvas failed to produce blob."),
              );
            }
          },
          mimeType,
          format === "jpg" ? 0.9 : undefined,
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
            new CustomError(
              "VideoError",
              "Seeked event did not fire in time and video is not ready.",
            ),
          );
        }
      }, 2000);

      video.currentTime = time;
    });
  }

  // Private method to check if the canvas is mostly black
  private isCanvasMostlyBlack(
    canvas: HTMLCanvasElement,
    threshold = 10,
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

  // Private method to calculate thumbnail timestamps
  private calculateSnapshotTimes(
    duration: number,
    numSnapshots: number,
    thumbnailInterval = 5,
  ): number[] {
    const snapshotTimes: number[] = [];
    const interval = thumbnailInterval;
    for (let i = 0; i < numSnapshots; i++) {
      const time = interval * (i + 1);
      if (time < duration) {
        snapshotTimes.push(time);
      }
    }
    this.logger.info("Generated snapshot times.", { snapshotTimes });
    return snapshotTimes;
  }

  // Private method to generate thumbnails using native methods
  private async generateThumbnailsWithVideo(
    videoFile: File | Blob,
    options: ThumbnailOptions,
  ): Promise<Thumbnail[]> {
    const { numSnapshots = 5, format = "png", thumbnailInterval = 5 } = options;
    const duration = await this.getVideoDuration(videoFile);
    const snapshotTimes = this.calculateSnapshotTimes(
      duration,
      numSnapshots,
      thumbnailInterval,
    );
    const thumbnails: Thumbnail[] = [];

    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;

    const videoUrl = URL.createObjectURL(videoFile);
    video.src = videoUrl;

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(
          new CustomError(
            "VideoError",
            "Video element failed to load (timeout).",
          ),
        );
      }, 10000);

      video.onloadedmetadata = () => {
        clearTimeout(timeout);
        resolve();
      };

      video.onerror = () => {
        clearTimeout(timeout);
        reject(new CustomError("VideoError", "Video element failed to load."));
      };
    });

    try {
      await video.play();
      video.pause();
    } catch (err) {
      // Ignore playback errors
    }

    // Prime the video by seeking to an initial timestamp
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
        const result = await this.captureFrameAtTime(video, time, format);
        const isBlack = this.isCanvasMostlyBlack(result.canvas);
        const blobUrl = URL.createObjectURL(result.blob);

        thumbnails.push({
          blobUrl,
          blob: result.blob,
          arrayBuffer: await result.blob.arrayBuffer(),
          timestamp: time,
          videoDuration: duration,
          width: result.width,
          height: result.height,
          isBlack,
          method: "native",
        });
      } catch (err) {
        this.logger.warn(`Failed to capture frame at ${time} seconds:`, {
          error: err,
        });
      }
    }

    URL.revokeObjectURL(videoUrl);

    if (thumbnails.every((thumb) => thumb.isBlack)) {
      throw new CustomError(
        "ThumbnailError",
        "All captured frames are mostly black. Falling back to FFmpeg method.",
      );
    }

    return thumbnails;
  }

  // Private method to generate thumbnails using FFmpeg
  private async generateThumbnailsWithFFmpeg(
    videoFile: File | Blob,
    options: ThumbnailOptions,
  ): Promise<Thumbnail[]> {
    const { numSnapshots = 5, format = "png", thumbnailInterval = 5 } = options;
    if (format !== "png" && format !== "jpg") {
      throw new CustomError(
        "ThumbnailError",
        "Invalid format. Only 'png' and 'jpg' are supported.",
      );
    }

    const ffmpeg = await this.loadFFmpeg();

    let duration: number;
    try {
      duration = await this.getVideoDuration(videoFile);
    } catch (err) {
      this.logger.warn("Failed to determine video duration:", { error: err });
      duration = 60; // Default value
    }

    const snapshotTimes = this.calculateSnapshotTimes(
      duration,
      numSnapshots,
      thumbnailInterval,
    );
    const fileExtension =
      "name" in videoFile && videoFile.name.includes(".")
        ? videoFile.name.substring(videoFile.name.lastIndexOf("."))
        : ".mp4";
    const inputFileName = `input_video${fileExtension}`;

    try {
      const fileData = await fetchFile(videoFile);
      this.logger.info(`Video file loaded for FFmpeg processing.`, {
        fileData: fileData,
      });
      await ffmpeg.writeFile(inputFileName, fileData);
      this.logger.info(`Video file written to FFmpeg as ${inputFileName}.`);
    } catch (err: any) {
      throw new CustomError(
        "FFmpegError",
        `Failed to write video file to FFmpeg: ${err.message || err}`,
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
        this.logger.error(
          `Failed to generate thumbnail at ${timeStr} seconds:`,
          { error: err },
        );
      }
    }

    try {
      await ffmpeg.deleteFile(inputFileName);
    } catch (err) {
      this.logger.warn("Failed to clean up input file:", { error: err });
    }

    return thumbnails;
  }

  /**
   * Validates if the video file is valid based on its headers.
   * @param file - Video file.
   * @returns Promise that resolves with true if valid.
   */
  async isValidVideoFile(file: File | Blob): Promise<boolean> {
    try {
      const headerBytes = await this.readFileHeader(file, 12);
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
        {
          format: "3GP",
          signature: [0x66, 0x74, 0x79, 0x70, 0x33, 0x67, 0x70],
        },
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
            this.logger.info(`Detected video format: ${format}`);
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
            this.logger.info(`Detected video format: ${format}`);
            return true;
          }
        }
      }
      return file.type.startsWith("video/");
    } catch (err) {
      this.logger.error("Error validating video file:", { error: err });
      return false;
    }
  }

  // Private method to read the first N bytes of a file
  private async readFileHeader(
    file: File | Blob,
    length: number,
  ): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.onloadend = (e) => {
        resolve(e.target!.result as ArrayBuffer);
      };
      fileReader.onerror = () => {
        reject(new CustomError("FileReadError", "Error reading file header"));
      };
      const blob = file.slice(0, length);
      fileReader.readAsArrayBuffer(blob);
    });
  }
}

export default ThumbnailGenerator;
