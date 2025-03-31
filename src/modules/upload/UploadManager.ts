import { NetworkError, TimeoutError, UploadError } from "../../core/errors";
import Logger from "../../core/logger/Logger";
import ThumbnailGenerator from "../thumbnail/ThumbnailGenerator";
import {
  UploadConfig,
  UploadProgress,
  UploadRequest,
  UploadResult,
} from "./types";

class UploadManager {
  private logger: Logger;
  private thumbnailGenerator: ThumbnailGenerator;
  private config: UploadConfig;

  /**
   * Initializes the UploadManager with necessary dependencies and configurations.
   * @param logger - Logger instance for logging events and errors.
   * @param thumbnailGenerator - Instance responsible for generating thumbnails.
   * @param config - Optional configuration settings for uploads.
   */
  constructor(
    logger: Logger,
    thumbnailGenerator: ThumbnailGenerator,
    config?: Partial<UploadConfig>,
  ) {
    this.logger = logger;
    this.thumbnailGenerator = thumbnailGenerator;
    this.config = {
      minSpeedBps: 1 * 1024 * 1024, // 1 MB/s by default
      bufferPercentage: 0.2, // 20% buffer
      maxTimeout: 2 * 60 * 60 * 1000, // 2 hours in ms
      maxRetries: 3, // Default maximum of 3 retries
      retryDelay: (attempt) => Math.pow(2, attempt) * 1000, // Exponential backoff: 1s, 2s, 4s
      ...config,
    };
  }

  /**
   * Uploads content using an UploadRequest.
   * @param request - Upload request object containing file and upload details.
   * @returns Promise that resolves with the generated thumbnails.
   */
  async uploadContent(request: UploadRequest): Promise<UploadResult> {
    try {
      // Validate the file type before proceeding
      if (
        !request.file.type.startsWith("video/") &&
        !request.file.type.startsWith("image/") &&
        !request.file.type.startsWith("audio/")
      ) {
        this.logger.warn("Unsupported file type.", {
          fileType: request.file.type,
        });
        throw new UploadError(
          "Unsupported file type. Only videos, images, and audio files are allowed.",
        );
      }

      this.logger.info("Content type: " + request.file.type, {
        contentType: request.file.type,
      });

      this.logger.info("Preparing to upload content.", {
        fileName: request.file.name,
      });

      const { url: presignedUrl, postParams } = request.signedUploadObject;

      let thumbnails: string[] = [];

      // Define progress milestones
      const THUMBNAIL_PROGRESS_WEIGHT = 0.01; // 1%
      const UPLOAD_PROGRESS_WEIGHT = 1; // 100%

      // Initialize total progress variables
      let totalProgress = 0;

      // Build FormData for the upload
      const formData = this.buildFormData(postParams, request.file);
      this.logger.info("FormData constructed.", { formData });

      // Calculate dynamic timeout based on file size and minimum speed
      const dynamicTimeout = this.calculateTimeout(request.file.size);
      this.logger.info(
        `Calculated dynamic timeout: ${dynamicTimeout / 1000} seconds`,
      );

      // Upload the file to S3 using XMLHttpRequest with retries
      let attempts = 0;
      const maxRetries = this.config.maxRetries;
      const delay = (attempt: number) =>
        new Promise((resolve) =>
          setTimeout(resolve, this.config.retryDelay(attempt)),
        );

      while (attempts < maxRetries) {
        try {
          if (request.onProgress) {
            request.onProgress({
              percentage: totalProgress,
              uploadedBytes: 0,
              totalBytes: request.file.size,
              speedBps: 0,
              timeRemaining: 0,
              status: "uploading",
            });
          }

          await this.uploadToPresignedUrl(
            presignedUrl,
            formData,
            (uploadProgress) => {
              if (request.onProgress) {
                // Calculate the upload progress portion
                const uploadPercentage =
                  uploadProgress.percentage * UPLOAD_PROGRESS_WEIGHT;
                const combinedPercentage = parseInt(
                  Math.min(totalProgress + uploadPercentage, 100).toFixed(0),
                );

                request.onProgress({
                  percentage: combinedPercentage,
                  uploadedBytes: uploadProgress.uploadedBytes,
                  totalBytes: uploadProgress.totalBytes,
                  speedBps: uploadProgress.speedBps,
                  timeRemaining: uploadProgress.timeRemaining,
                  status: "uploading",
                });
              }
            },
            dynamicTimeout,
          );

          this.logger.info("Upload to S3 successful.");

          // Update total progress to reflect upload completion
          totalProgress += parseInt((UPLOAD_PROGRESS_WEIGHT * 100).toFixed(0));
          if (request.onProgress) {
            request.onProgress({
              percentage: Math.min(totalProgress, 100),
              uploadedBytes: request.file.size,
              totalBytes: request.file.size,
              speedBps: 0,
              timeRemaining: 0,
              status: "uploadCompleted",
            });
          }

          break;
        } catch (error: any) {
          attempts++;
          if (attempts < maxRetries) {
            this.logger.warn(`Retrying upload, attempt ${attempts}`, {
              error,
            });
            if (request.onProgress) {
              request.onProgress({
                percentage: totalProgress,
                uploadedBytes: 0,
                totalBytes: request.file.size,
                speedBps: 0,
                timeRemaining: 0,
                status: "uploading",
              });
            }
            await delay(attempts);
          } else {
            this.logger.error("Max retries reached. Upload failed.", { error });
            if (request.onProgress) {
              request.onProgress({
                percentage: totalProgress,
                uploadedBytes: 0,
                totalBytes: request.file.size,
                speedBps: 0,
                timeRemaining: 0,
                status: "errorUploading",
              });
            }
            throw new UploadError(
              "Failed to upload content after multiple attempts.",
              {
                originalError: error,
              },
            );
          }
        }
      }

      // After a successful upload, generate thumbnails if necessary
      if (
        request.generateThumbnails &&
        request.file.type.startsWith("video/")
      ) {
        if (request.onProgress) {
          request.onProgress({
            percentage: totalProgress, // Maintain the current progress
            uploadedBytes: request.file.size,
            totalBytes: request.file.size,
            speedBps: 0,
            timeRemaining: 0,
            status: "generatingThumbnails",
          });
        }

        this.logger.info("Generating thumbnails.", {
          fileName: request.file.name,
          thumbnailOptions: request.thumbnailOptions,
        });

        try {
          const generatedThumbnails =
            await this.thumbnailGenerator.generateThumbnails(
              request.file,
              request.thumbnailOptions || {},
            );

          thumbnails = generatedThumbnails.map((thumb) => thumb.blobUrl);
          this.logger.info("Thumbnails generated successfully.", {
            thumbnails,
          });

          // Update the full progress to 100%
          totalProgress = 100;
          if (request.onProgress) {
            request.onProgress({
              percentage: totalProgress,
              uploadedBytes: request.file.size,
              totalBytes: request.file.size,
              speedBps: 0,
              timeRemaining: 0,
              status: "thumbnailsGenerated",
            });
          }

          // Invoke the completed thumbnails callback
          if (request.onThumbnailsComplete) {
            request.onThumbnailsComplete(thumbnails);
          }
        } catch (err: any) {
          this.logger.error("Error generating thumbnails.", { error: err });
          if (request.onProgress) {
            request.onProgress({
              percentage: totalProgress,
              uploadedBytes: request.file.size,
              totalBytes: request.file.size,
              speedBps: 0,
              timeRemaining: 0,
              status: "errorGeneratingThumbnails",
            });
          }
          return { thumbnails: [] };
        }
      }

      return { thumbnails };
    } catch (error: any) {
      this.logger.error("Error during upload process.", { error });
      throw error;
    }
  }

  /**
   * Builds the FormData object for the upload.
   * @param postParams - Signed request parameters required by S3.
   * @param file - File to be uploaded.
   * @returns FormData object containing all necessary fields.
   */
  private buildFormData(
    postParams: { [key: string]: string },
    file: File,
  ): FormData {
    const formData = new FormData();
    Object.entries(postParams).forEach(([key, value]) => {
      formData.append(key, value);
    });
    formData.append("file", file);
    return formData;
  }

  /**
   * Calculates the dynamic timeout based on file size and minimum upload speed.
   * @param fileSize - Size of the file in bytes.
   * @returns Estimated timeout in milliseconds.
   */
  private calculateTimeout(fileSize: number): number {
    const estimatedTimeSeconds = fileSize / this.config.minSpeedBps;
    const bufferTimeSeconds =
      estimatedTimeSeconds * this.config.bufferPercentage;
    let totalTimeoutSeconds = estimatedTimeSeconds + bufferTimeSeconds;

    // Convert to milliseconds
    let totalTimeoutMs = Math.ceil(totalTimeoutSeconds * 1000);

    // Cap the timeout to the maximum allowed timeout
    if (totalTimeoutMs > this.config.maxTimeout) {
      totalTimeoutMs = this.config.maxTimeout;
    }

    return totalTimeoutMs;
  }

  /**
   * Performs the upload using XMLHttpRequest with progress tracking and dynamic timeout.
   * @param url - Pre-signed URL for the upload.
   * @param formData - FormData containing the upload parameters and file.
   * @param onProgress - Callback to report upload progress.
   * @param timeout - Dynamic timeout duration in milliseconds.
   * @returns Promise that resolves when the upload is successful.
   */
  private uploadToPresignedUrl(
    url: string,
    formData: FormData,
    onProgress?: (progress: UploadProgress) => void,
    timeout: number = 30000, // Default timeout of 30 seconds if not provided
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url, true);
      xhr.responseType = "text";
      xhr.timeout = timeout; // Set dynamic timeout

      let startTime = Date.now();

      xhr.upload.onprogress = (event: ProgressEvent) => {
        if (event.lengthComputable && onProgress) {
          const percentage = Math.round((event.loaded / event.total) * 100);
          const uploadedBytes = event.loaded;
          const totalBytes = event.total;

          const elapsedTime = (Date.now() - startTime) / 1000; // Seconds
          const speedBps = uploadedBytes / elapsedTime; // Bytes per second

          const timeRemaining =
            speedBps > 0 ? (totalBytes - uploadedBytes) / speedBps : 0;

          onProgress({
            percentage,
            uploadedBytes,
            totalBytes,
            speedBps,
            timeRemaining: timeRemaining > 0 ? timeRemaining : 0,
          });
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          this.logger.error(`Upload failed with status ${xhr.status}`, {
            status: xhr.status,
            response: xhr.responseText,
          });
          reject(
            new UploadError(`Upload failed with status ${xhr.status}`, {
              status: xhr.status,
              responseBody: xhr.responseText,
            }),
          );
        }
      };

      xhr.onerror = () => {
        this.logger.error("A network error occurred during the upload.");
        reject(new NetworkError("A network error occurred during the upload."));
      };

      xhr.ontimeout = () => {
        this.logger.error("Upload exceeded the timeout limit.");
        reject(new TimeoutError("Upload exceeded the timeout limit."));
      };

      xhr.send(formData);
    });
  }

  /**
   * Implements a retry mechanism with exponential backoff.
   * @param fn - Function that returns a Promise to be retried.
   * @param retriesLeft - Number of retry attempts remaining.
   * @param delayFn - Function to calculate delay before the next retry.
   */
  private async retryRequest(
    fn: () => Promise<void>,
    retriesLeft: number,
    delayFn: (attempt: number) => number,
  ): Promise<void> {
    let attempt = 0;
    while (attempt <= retriesLeft) {
      try {
        await fn();
        return; // Exit if successful
      } catch (error) {
        if (attempt < retriesLeft) {
          const delay = delayFn(attempt);
          this.logger.warn(
            `Retrying upload, attempt ${attempt + 1} in ${delay}ms`,
            {
              error,
            },
          );
          await this.sleep(delay);
          attempt++;
        } else {
          this.logger.error("Max retries reached. Upload failed.", { error });
          throw error;
        }
      }
    }
  }

  /**
   * Pauses execution for a specified duration.
   * @param ms - Duration in milliseconds to sleep.
   * @returns Promise that resolves after the specified duration.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default UploadManager;
