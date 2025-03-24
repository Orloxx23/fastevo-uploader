import { UploadOptions as CoreUploadOptions } from "../../core/config/types";

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

export interface UploadResponse {
  contentId: string;
  signedUploadObject: SignedUploadObject;
}

export interface UploadProgress {
  percentage: number;
  uploadedBytes: number;
  totalBytes: number;
  speedBps: number;
  timeRemaining: number;
}

export interface UploadRequest {
  file: File;
  options: CoreUploadOptions;
  onProgress?: (progress: UploadProgress) => void;
}

export interface UploadResult {
  thumbnails: string[];
}
