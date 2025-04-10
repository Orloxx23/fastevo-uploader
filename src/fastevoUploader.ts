import Logger from "./core/logger/Logger";
import { Thumbnail, ThumbnailOptions } from "./modules/thumbnail/types";
import ThumbnailGenerator from "./modules/thumbnail/ThumbnailGenerator";
import UploadManager from "./modules/upload/UploadManager";
import {
  UploadEvent,
  UploadProgress,
  UploadRequest,
  UploadResult,
} from "./modules/upload/types";
import { Environment } from "./core/environment/environment";
import EventEmitter from "events";

/**
 * Main class that orchestrates the different modules of FastevoUploader.
 * Implemented as a Singleton for ease of use.
 */
class FastevoUploader extends EventEmitter {
  private uploadManager: UploadManager;
  private thumbnailGenerator: ThumbnailGenerator;
  private logger: Logger;

  constructor(options?: { preload?: boolean }) {
    super();
    this.logger = new Logger({
      level: "info",
    });
    this.thumbnailGenerator = new ThumbnailGenerator(this.logger);
    this.uploadManager = new UploadManager(
      this.logger,
      this.thumbnailGenerator,
    );

    // Check if the environment is a browser
    if (!Environment.isBrowser()) {
      this.logger.info(
        "Environment is not a browser. Skipping FFmpeg preloading.",
      );
      return;
    }

    if (options?.preload) {
      this.preloadFFmpeg();
    }

    // Forward all events from uploadManager
    this.uploadManager.on(
      "uploadProgress",
      (file: File, progress: UploadProgress) => {
        this.emit("uploadProgress", file, progress);
      },
    );

    this.uploadManager.on("uploadComplete", (file: File, result: any) => {
      this.emit("uploadComplete", file, result);
    });

    this.uploadManager.on("uploadError", (file: File, error: any) => {
      this.logger.error("Upload error:", { error });
      this.emit("uploadError", file, error);
    });

    this.uploadManager.on("uploadPaused", (file: File) => {
      this.emit("uploadPaused", file);
    });

    this.uploadManager.on("uploadResumed", (file: File) => {
      this.emit("uploadResumed", file);
    });

    this.uploadManager.on(
      "thumbnailsGenerated",
      (file: File, thumbnails: any) => {
        this.emit("thumbnailsGenerated", file, thumbnails);
      },
    );
  }

  /**
   * Adds an event listener for a specific upload event.
   * @param eventName - The name of the event to listen for.
   */
  public on<K extends UploadEvent>(
    eventName: K,
    listener: (...args: any[]) => void,
  ): this {
    super.on(eventName, listener);
    return this;
  }

  /**
   * Removes an event listener for a specific upload event.
   * @param eventName - The name of the event to stop listening for.
   */
  public off<K extends UploadEvent>(
    eventName: K,
    listener: (...args: any[]) => void,
  ): this {
    super.off(eventName, listener);
    return this;
  }

  /**
   * Preloads FFmpeg to improve performance when generating thumbnails.
   */
  private async preloadFFmpeg() {
    try {
      const preloaded = await this.thumbnailGenerator.preloadFFmpeg();
      if (preloaded) {
        this.logger.info("FFmpeg preloaded successfully.");
      } else {
        this.logger.warn("FFmpeg preloading failed.");
      }
    } catch (err) {
      this.logger.error("Error during FFmpeg preloading.", { error: err });
    }
  }

  /**
   * Uploads content using the established configuration.
   * @param request - Upload request object.
   * @returns Promise that resolves with the generated thumbnails.
   */
  async uploadContent(request: UploadRequest): Promise<UploadResult> {
    return this.uploadManager.uploadContent(request);
  }

  /**
   * Generates thumbnails for a given video or image file.
   * @param file - The video or image file for which to generate thumbnails.
   * @param options - Optional settings for thumbnail generation.
   * @returns Promise that resolves with an array of generated thumbnails.
   */
  async generateThumbnails(
    file: File | Blob,
    options?: ThumbnailOptions,
  ): Promise<string[]> {
    try {
      this.logger.info("Starting thumbnail generation.", {
        fileName: (file as File).name,
      });

      const thumbnails = await this.thumbnailGenerator.generateThumbnails(
        file,
        options || {},
      );

      this.logger.info("Thumbnail generation completed.", {
        numberOfThumbnails: thumbnails.length,
      });

      return thumbnails.map((thumbnail) => thumbnail.blobUrl);
    } catch (error: any) {
      this.logger.error("Error during thumbnail generation.", { error });
      return [];
    }
  }

  /**
   * Pauses an ongoing upload.
   */
  pause() {
    this.uploadManager.pauseUpload();
  }

  /**
   * Resumes a paused upload.
   */
  resume() {
    this.uploadManager.resumeUpload();
  }

  /**
   * Cancels an ongoing upload.
   */
  abort() {
    this.uploadManager.abortUpload();
  }
}

const fastevoInstance = new FastevoUploader();
export default fastevoInstance;
export { FastevoUploader };
