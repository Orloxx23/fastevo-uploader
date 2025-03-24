import { UploadOptions } from "@/modules/upload/types";

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
