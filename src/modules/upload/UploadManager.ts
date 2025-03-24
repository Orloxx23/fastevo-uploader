import { UploadRequest, UploadResult, UploadProgress } from "./types";
import ApiClient from "../../core/api/ApiClient";
import {
  CustomError,
  UploadError,
  NetworkError,
  TimeoutError,
} from "../../core/errors";
import Logger from "../../core/logger/Logger";
import { ThumbnailGenerator } from "../thumbnail";

class UploadManager {
  private apiClient: ApiClient;
  private logger: Logger;
  private thumbnailGenerator: ThumbnailGenerator;

  constructor(
    apiClient: ApiClient,
    logger: Logger,
    thumbnailGenerator: ThumbnailGenerator,
  ) {
    this.apiClient = apiClient;
    this.logger = logger;
    this.thumbnailGenerator = thumbnailGenerator;
  }

  /**
   * Uploads content using an upload request.
   * @param request - Upload request object.
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

      this.logger.info("Preparing to upload content.", {
        fileName: request.file.name,
      });

      // 1. Get the signed upload object
      const uploadResponse = await this.apiClient.uploadContent(
        request.options,
      );
      this.logger.info("Pre-signed URL obtained.");

      const { url: presignedUrl, postParams } =
        uploadResponse.signedUploadObject;

      // 2. Build FormData for the upload
      const formData = this.buildFormData(postParams, request.file);
      this.logger.debug("FormData construida.", { formData });

      // 3. Upload the file to S3 using XMLHttpRequest with retries
      let attempts = 0;
      const maxRetries = 3;
      const delay = (attempt: number) =>
        new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000),
        );

      while (attempts < maxRetries) {
        try {
          await this.uploadToPresignedUrl(
            presignedUrl,
            formData,
            request.onProgress,
          );
          this.logger.info("Upload to S3 successful.");
          break;
        } catch (error) {
          attempts++;
          if (attempts < maxRetries) {
            this.logger.warn(`Retrying upload attempt ${attempts}`, { error });
            await delay(attempts);
          } else {
            throw error;
          }
        }
      }

      const finalUrl = presignedUrl.split("?")[0];
      let thumbnails: string[] = [];

      // 4. Generate thumbnails if it's a video or image
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
      throw new UploadError("Failed to upload content.", {
        originalError: error,
      });
    }
  }

  /**
   * Builds the FormData object for the upload.
   * @param postParams - Signed request parameters.
   * @param file - File to upload.
   * @returns FormData object.
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
   * Uploads the file to the pre-signed URL.
   * @param url - Pre-signed URL for the upload.
   * @param formData - FormData containing the parameters and file.
   * @param onProgress - Callback for upload progress.
   * @returns Promise that resolves when the upload completes.
   */
  private uploadToPresignedUrl(
    url: string,
    formData: FormData,
    onProgress?: (progress: UploadProgress) => void,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url, true);
      xhr.responseType = "text";
      xhr.timeout = 30000; // 30-second timeout

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
          });
          reject(
            new UploadError(`Upload failed with status ${xhr.status}`, {
              status: xhr.status,
            }),
          );
        }
      };

      xhr.onerror = () => {
        this.logger.error("Network error occurred during upload");
        reject(new NetworkError("Network error occurred during upload"));
      };

      xhr.ontimeout = () => {
        this.logger.error("Upload timed out");
        reject(new TimeoutError("Upload timed out"));
      };

      xhr.send(formData);
    });
  }

  /**
   * Generates thumbnails for video files.
   * @param file - Video file.
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
