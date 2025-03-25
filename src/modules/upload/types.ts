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

export interface UploadRequest {
  file: File;
  signedUploadObject: SignedUploadObject;
  onProgress?: (progress: UploadProgress) => void;
}

export interface UploadResult {
  thumbnails: string[];
}
