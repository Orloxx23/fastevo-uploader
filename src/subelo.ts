import ApiClient from "./core/api/ApiClient";
import ConfigManager from "./core/config/ConfigManager";
import { Config } from "./core/config/types";
import { Environment } from "./core/enviorment/enviorment";
import Logger from "./core/logger/Logger";
import { ThumbnailGenerator } from "./modules/thumbnail";
import { UploadManager } from "./modules/upload";
import { UploadRequest, UploadResult } from "./modules/upload/types";

/**
 * Main class that orchestrates the different modules of Subelo.js.
 */
class Subelo {
  private uploadManager: UploadManager;
  private thumbnailGenerator: ThumbnailGenerator;
  private logger: Logger;

  constructor(config: Config) {
    // Check the environment before proceeding
    Environment.requireBrowserEnvironment();

    ConfigManager.setConfig(config);
    const apiClient = new ApiClient(ConfigManager.getConfig());

    this.logger = new Logger({
      level: config.debug ? "debug" : "info",
      debug: config.debug,
    });
    this.thumbnailGenerator = new ThumbnailGenerator(this.logger);
    this.uploadManager = new UploadManager(
      apiClient,
      this.logger,
      this.thumbnailGenerator,
    );

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
        this.logger.error("Error during FFmpeg preloading.", { error: err });
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
}

export default Subelo;
