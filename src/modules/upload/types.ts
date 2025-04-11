import { FastevoUploader } from "@/fastevoUploader";
import { ThumbnailOptions } from "../thumbnail";

/**
 * Interface for the upload progress event.
 */
export type UploadProgress = {
  /**
   * The percentage of the upload completed.
   */
  percentage: number;

  /**
   * The number of bytes uploaded so far.
   */
  uploadedBytes: number;

  /**
   * The total number of bytes to be uploaded.
   */
  totalBytes: number;

  /**
   * The time in milli
   * seconds since the upload started.
   */
  speedBps: number;

  /**
   * The time in milliseconds since the upload started.
   */
  timeRemaining: number;
};

/**
 * Interface for the upload error event.
 */
export type UploadRequest = {
  /**
   * The token used for multipart upload.
   */
  multipartUploadToken: string;

  /**
   * The file to be uploaded.
   */
  file: File;

  /**
   * The API URL base for the upload.
   */
  apiUrlBase?: string;

  /**
   * The name of the file to be uploaded.
   */
  generateThumbnails?: boolean;

  /**
   * Options for generating thumbnails.
   */
  thumbnailOptions?: ThumbnailOptions;
};

/**
 * Interface for the upload result.
 */
export type UploadResult = {
  /**
   * The URL of the uploaded file.
   */
  thumbnails: string[];
};

export type UploadConfig = {
  /**
   * The minimum speed in bytes per second.
   */
  minSpeedBps: number;

  /**
   * The minimum percentage of the upload completed.
   */
  bufferPercentage: number;

  /**
   * The maximum time in milliseconds to wait before retrying.
   */
  maxTimeout: number;

  /**
   * The maximum number of retries for the upload.
   */
  maxRetries: number;

  /**
   * The delay in milliseconds before retrying the upload.
   */
  retryDelay: (attempt: number) => number;
};

/**
 * Interface for the upload event.
 */
export type UploadEvent =
  | "uploadProgress"
  | "uploadComplete"
  | "uploadError"
  | "uploadPaused"
  | "uploadResumed"
  | "thumbnailsGenerationStarted"
  | "thumbnailsGenerated";

/**
 * Interface for the upload event listener.
 */
export type UploadListener = (...args: any[]) => void;

/**
 * Interface for the upload manager.
 */
export type UploaderConfig = {
  /**
   * The token used for multipart upload.
   */
  uploadToken: string;

  /**
   * The file to be uploaded.
   */
  options?: {
    /**
     * The file to be uploaded.
     */
    apiUrlBase?: string;
  };
};

/**
 * Interface for the upload manager.
 */
export type ActiveUpload = {
  /**
   * The file to be uploaded.
   */
  uploader: FastevoUploader;

  /**
   * The file to be uploaded.
   */
  lastUpdateTime: number;

  /**
   * The file to be uploaded.
   */
  status: "idle" | "uploading" | "paused" | "resumed";

  /**
   * The file to be uploaded.
   */
  lastPauseTime: number;

  /**
   * The file to be uploaded.
   */
  totalPausedTime: number;
};
