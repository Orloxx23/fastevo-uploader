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

export interface ThumbnailOptions {
  /** Maximum width of the thumbnail in pixels */
  maxWidth?: number;
  /** Maximum height of the thumbnail in pixels */
  maxHeight?: number;
  /** Thumbnail quality (0-1) */
  quality?: number;
  /** Format of the thumbnail (jpeg, png, webp) */
  format?: "jpeg" | "png" | "webp";
  /** Generate multiple thumbnails at different sizes */
  sizes?: Array<{ width: number; height: number; suffix: string }>;
  /** Video thumbnail specific options */
  video?: {
    /** Number of snapshots to take from the video */
    numSnapshots?: number;
    /** Time interval between snapshots in seconds */
    thumbnailInterval?: number;
    /** Method to use for video thumbnail generation: 'auto', 'native', or 'ffmpeg' */
    method?: "auto" | "native" | "ffmpeg";
  };
}

export interface UploaderOptions {
  maxConcurrent?: number;
  autoRetry?: boolean;
  maxRetries?: number;
  enableThumbnailGeneration?: boolean;
  thumbnailOptions?: ThumbnailOptions;
  headers?: Record<string, string>;
  chunkSize?: number;
}

export interface ProgressEvent {
  loaded: number;
  total: number;
  percentage: number;
  file: File;
  uploadId: string;
}

export interface SuccessEvent {
  location: string;
  key: string;
  etag?: string;
  file: File;
  uploadId: string;
  thumbnails?: Array<{ url: string; width: number; height: number }>;
}

export interface ErrorEvent {
  message: string;
  error: Error;
  file: File;
  uploadId: string;
  retryAttempt?: number;
}

export interface CustomErrorEvent extends ErrorEvent {
  file: File;
  uploadId: string;
  retryAttempt: number;
}

export interface StateChangeEvent {
  previousState: UploadState;
  currentState: UploadState;
  file: File;
  uploadId: string;
}

export enum UploadState {
  PENDING = "pending",
  PREPARING = "preparing",
  UPLOADING = "uploading",
  PROCESSING = "processing",
  GENERATING_THUMBNAIL = "generating_thumbnail",
  COMPLETE = "complete",
  ERROR = "error",
  CANCELED = "canceled",
}

export enum EventType {
  PROGRESS = "progress",
  SUCCESS = "success",
  ERROR = "error",
  STATE_CHANGE = "stateChange",
  ALL_COMPLETE = "allComplete",
  THUMBNAIL_GENERATED = "thumbnailGenerated",
  UPLOAD_CREATED = "uploadCreated",
  RETRY = "retry",
}

export interface UploadOptions {
  title?: string;
  folderPath: string;
  priority: number;
  watermarkProfile: string | null;
  tags?: string[];
}

export interface UploadResponse {
  contentId: "string";
  signedUploadObject: SignedUploadObject;
}

type EventListener = (data: any) => void;
