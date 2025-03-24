export interface UploadProgress {
  percentage: number;
  uploadedBytes: number;
  totalBytes: number;
  speedBps: number;
  timeRemaining: number;
}

export interface UploadRequest {
  file: File;
  options: UploadOptions;
  onProgress?: (progress: UploadProgress) => void;
}

export interface UploadOptions {
  title?: string;
  folderPath: string;
  priority: number;
  watermarkProfile: string | null;
  tags?: string[];
}
