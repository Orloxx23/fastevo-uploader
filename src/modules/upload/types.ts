import { ThumbnailOptions } from "../thumbnail";

export interface SignedUploadObject {
  url: string;
  postParams: {
    bucket: string;
    "X-Amz-Algorithm": string;
    "X-Amz-Credential": string;
    "X-Amz-Date": string;
    key: string;
    Policy: string;
    "X-Amz-Signature": string;
    "X-Amz-Storage-Class": string;
    [key: string]: string;
  };
}

export interface UploadProgress {
  percentage: number;
  uploadedBytes: number;
  totalBytes: number;
  speedBps: number;
  timeRemaining: number;
}

export interface UploadProgressExtended extends UploadProgress {
  status:
    | "generatingThumbnails"
    | "uploading"
    | "errorUploading"
    | "errorGeneratingThumbnails"
    | "uploadCompleted"
    | "thumbnailsGenerated";
}

export interface UploadRequest {
  file: File;
  signedUploadObject: SignedUploadObject;
  generateThumbnails?: boolean;
  thumbnailOptions?: ThumbnailOptions;
  onProgress?: (progress: UploadProgressExtended) => void;
  onThumbnailsComplete?: (thumbnails: string[]) => void;
}

export interface UploadResult {
  thumbnails: string[];
}

export interface UploadConfig {
  minSpeedBps: number;
  bufferPercentage: number;
  maxTimeout: number;
  maxRetries: number;
  retryDelay: (attempt: number) => number;
}
