import { UploadOptions } from "@/modules/upload/UploadRequest";

export interface Config {
  apiKey: string;
  baseUrl?: string;
}

export interface UploadRequest {
  file: File;
  options: UploadOptions;
  onProgress: (progress: {
    percentage: number;
    uploadedBytes: number;
    totalBytes: number;
    speedBps: number;
    timeRemaining: number;
  }) => void;
}
