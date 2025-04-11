/**
 * Thumbnail Generation Types
 */
export type IntervalType = "manual" | "automatic";

/**
 * Options for thumbnail generation.
 */
export interface ThumbnailOptions {
  /**
   * The interval between thumbnails in seconds.
   */
  numSnapshots?: number;

  /**
   * The format of the thumbnail images.
   */
  format?: "png" | "jpg";

  /**
   * The width of the thumbnail images.
   */
  method?: "auto" | "native" | "ffmpeg";

  /**
   * The height of the thumbnail images.
   */
  thumbnailInterval?: number;

  /**
   * The number of thumbnails to generate.
   */
  intervalType?: IntervalType;
}

/**
 * Interface for thumbnail generation progress.
 */
export interface Thumbnail {
  /**
   * The URL of the generated thumbnail.
   */
  blobUrl: string;

  /**
   * The Blob object of the generated thumbnail.
   */
  blob: Blob;

  /**
   * The canvas element used to generate the thumbnail.
   */
  arrayBuffer: ArrayBuffer;

  /**
   * The timestamp of the thumbnail in seconds.
   */
  timestamp: number;

  /**
   * The width of the thumbnail image.
   */
  videoDuration: number;

  /**
   * The height of the thumbnail image.
   */
  width?: number;

  /**
   * The height of the thumbnail image.
   */
  height?: number;

  /**
   * The format of the thumbnail image.
   */
  isBlack?: boolean;

  /**
   * The format of the thumbnail image.
   */
  method: "native" | "ffmpeg";
}

/**
 * Interface for thumbnail generation progress.
 */
export interface CapturedFrame {
  /**
   * The URL of the generated thumbnail.
   */
  blob: Blob;

  /**
   * The Blob object of the generated thumbnail.
   */
  canvas: HTMLCanvasElement;

  /**
   * The Blob object of the generated thumbnail.
   */
  timestamp: number;

  /**
   * The Blob object of the generated thumbnail.
   */
  width: number;

  /**
   * The Blob object of the generated thumbnail.
   */
  height: number;
}

/**
 * Interface for thumbnail generation progress.
 */
export type ThumbnailGenerationStatus =
  | "initializing"
  | "generatingThumbnails"
  | "completed"
  | "errorGeneratingThumbnails"
  | "thumbnailsGenerated";
