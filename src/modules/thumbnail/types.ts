/**
 * Defines the types of interval calculation methods.
 */
export type IntervalType = "manual" | "automatic";

/**
 * Options for thumbnail generation.
 */
export interface ThumbnailOptions {
  /**
   * The number of thumbnails to generate.
   * @default 5
   */
  numSnapshots?: number;

  /**
   * The format of the thumbnail images.
   * @default "png"
   */
  format?: "png" | "jpg";

  /**
   * The method to use for thumbnail generation.
   * @default "auto"
   */
  method?: "auto" | "native" | "ffmpeg";

  /**
   * The interval between thumbnails in seconds (used if intervalType is "manual").
   */
  thumbnailInterval?: number;

  /**
   * The type of interval calculation.
   * @default "automatic"
   */
  intervalType?: IntervalType;
}

/**
 * Interface representing a generated thumbnail.
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
   * The ArrayBuffer of the generated thumbnail.
   */
  arrayBuffer: ArrayBuffer;

  /**
   * The timestamp of the thumbnail in seconds.
   */
  timestamp: number;

  /**
   * The duration of the video in seconds.
   */
  videoDuration: number;

  /**
   * The width of the thumbnail image.
   */
  width?: number;

  /**
   * The height of the thumbnail image.
   */
  height?: number;

  /**
   * Indicates if the thumbnail is mostly black.
   */
  isBlack?: boolean;

  /**
   * The method used to generate the thumbnail.
   */
  method: "native" | "ffmpeg";
}

/**
 * Interface representing a captured frame during thumbnail generation.
 */
export interface CapturedFrame {
  /**
   * The Blob object of the captured frame.
   */
  blob: Blob;

  /**
   * The canvas element used to capture the frame.
   */
  canvas: HTMLCanvasElement;

  /**
   * The timestamp of the frame in seconds.
   */
  timestamp: number;

  /**
   * The width of the frame.
   */
  width: number;

  /**
   * The height of the frame.
   */
  height: number;
}

/**
 * Enumeration of thumbnail generation statuses.
 */
export type ThumbnailGenerationStatus =
  | "initializing"
  | "generatingThumbnails"
  | "completed"
  | "errorGeneratingThumbnails"
  | "thumbnailsGenerated";
