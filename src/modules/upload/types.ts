import { FastevoUploader } from "@/fastevoUploader";
import { ThumbnailOptions } from "../thumbnail";

export type UploadProgress = {
  percentage: number;
  uploadedBytes: number;
  totalBytes: number;
  speedBps: number;
  timeRemaining: number;
};

export type UploadRequest = {
  multipartUploadToken: string;
  file: File;
  apiUrlBase?: string;
  generateThumbnails?: boolean;
  thumbnailOptions?: ThumbnailOptions;
};

export type UploadResult = {
  thumbnails: string[];
};

export type UploadConfig = {
  minSpeedBps: number;
  bufferPercentage: number;
  maxTimeout: number;
  maxRetries: number;
  retryDelay: (attempt: number) => number;
};

export type UploadEvent =
  | "uploadProgress"
  | "uploadComplete"
  | "uploadError"
  | "uploadPaused"
  | "uploadResumed"
  | "thumbnailsGenerationStarted"
  | "thumbnailsGenerated";

export type UploadListener = (...args: any[]) => void;

export type UploaderConfig = {
  uploadToken: string;
  options?: {
    apiUrlBase?: string;
  };
};

export type ActiveUpload = {
  uploader: FastevoUploader;
  lastUpdateTime: number;
  status: "idle" | "uploading" | "paused" | "resumed";
  lastPauseTime: number;
  totalPausedTime: number;
}
