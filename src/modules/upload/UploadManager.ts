// UploadManager.ts

import { UploadRequest, UploadResult, UploadProgress } from "./types";
import {
  CustomError,
  UploadError,
  NetworkError,
  TimeoutError,
} from "../../core/errors";
import Logger from "../../core/logger/Logger";
import ThumbnailGenerator from "../thumbnail/ThumbnailGenerator";

/**
 * Configuration interface for upload settings.
 */
interface UploadConfig {
  minSpeedBps: number; // Minimum upload speed in bytes per second
  bufferPercentage: number; // Additional buffer time as a percentage
  maxTimeout: number; // Maximum allowed timeout in milliseconds
  maxRetries: number; // Maximum number of retry attempts
  retryDelay: (attempt: number) => number; // Function to calculate delay between retries
}

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
          await this.uploadToPresignedUrl(
            presignedUrl,
            formData,
            request.onProgress,
            dynamicTimeout,
          );
          this.logger.info("Upload to S3 successful.");
          break;
        } catch (error) {
          attempts++;
          if (attempts < maxRetries) {
            this.logger.warn(`Retrying upload, attempt ${attempts}`, {
              error,
            });
            await delay(attempts);
          } else {
            throw error;
          }
        }
      }

      // Generate thumbnails if the upload was successful
      let thumbnails: string[] = [];

      if (request.file.type.startsWith("video/")) {
        thumbnails = await this.generateVideoThumbnails(request.file);
      } else if (request.file.type.startsWith("image/")) {
        thumbnails.push(URL.createObjectURL(request.file));
      }

      return { thumbnails };
    } catch (error: any) {
      this.logger.error("Error during content upload.", { error });
      if (error instanceof CustomError) {
        throw error;
      }
      // Wrap generic errors
      throw new UploadError("Error uploading content.", {
        originalError: error,
      });
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

  /**
   * Generates thumbnails for video files.
   * @param file - Video file for which thumbnails are to be generated.
   * @returns Promise that resolves with an array of thumbnail URLs.
   */
  private async generateVideoThumbnails(file: File): Promise<string[]> {
    try {
      this.logger.info("Generating video thumbnails.", {
        fileName: file.name,
      });
      const thumbnails = await this.thumbnailGenerator.generateThumbnails(
        file,
        {
          numSnapshots: 4,
          format: "png",
          method: "ffmpeg",
          thumbnailInterval: 5,
        },
      );
      this.logger.info("Thumbnails generated successfully.", { thumbnails });
      return thumbnails.map((thumb) => thumb.blobUrl);
    } catch (error) {
      this.logger.warn("Error generating video thumbnails.", { error });
      return [];
    }
  }
}

export default UploadManager;
