import { Thumbnail } from "./types";

/**
 * Class representing a generated thumbnail image.
 */
export class ThumbnailImage implements Thumbnail {
  /** The URL of the generated thumbnail. */
  blobUrl: string;

  /** The Blob object of the generated thumbnail. */
  blob: Blob;

  /** The ArrayBuffer of the generated thumbnail. */
  arrayBuffer: ArrayBuffer;

  /** The timestamp of the thumbnail in seconds. */
  timestamp: number;

  /** The duration of the video in seconds. */
  videoDuration: number;

  /** The width of the thumbnail image. */
  width?: number;

  /** The height of the thumbnail image. */
  height?: number;

  /** Indicates if the thumbnail is mostly black. */
  isBlack?: boolean;

  /** The method used to generate the thumbnail (`native` or `ffmpeg`). */
  method: "native" | "ffmpeg";

  /**
   * Constructs a new ThumbnailImage instance.
   * @param params - The thumbnail parameters.
   */
  constructor(params: Thumbnail) {
    this.blobUrl = params.blobUrl;
    this.blob = params.blob;
    this.arrayBuffer = params.arrayBuffer;
    this.timestamp = params.timestamp;
    this.videoDuration = params.videoDuration;
    this.width = params.width;
    this.height = params.height;
    this.isBlack = params.isBlack;
    this.method = params.method;
  }
}
