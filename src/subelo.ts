import Logger from "./core/logger/Logger";
import { Thumbnail, ThumbnailOptions } from "./modules/thumbnail/types";
import ThumbnailGenerator from "./modules/thumbnail/ThumbnailGenerator";
import UploadManager from "./modules/upload/UploadManager";
import { UploadRequest, UploadResult } from "./modules/upload/types";
import { Environment } from "./core/environment/environment";

/**
 * Main class that orchestrates the different modules of Subelo.js.
 * Implemented as a Singleton for ease of use.
 */
class Subelo {
  private uploadManager: UploadManager;
  private thumbnailGenerator: ThumbnailGenerator;
  private logger: Logger;

  constructor() {
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

    // Preload FFmpeg if necessary
    this.thumbnailGenerator
      .preloadFFmpeg()
      .then((preloaded) => {
        if (preloaded) {
          this.logger.info("FFmpeg preloaded successfully.");
        } else {
          this.logger.warn("FFmpeg preloading failed.");
        }
      })
      .catch((err) => {
        this.logger.error("Error during FFmpeg preloading.", {
          error: err,
        });
      });
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
}

// Create a single instance of Subelo to be exported by default
const subeloInstance = new Subelo();

// Export the instance as the default export
export default subeloInstance;
