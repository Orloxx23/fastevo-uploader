import { Thumbnail } from "./types";

/**
 * Class representing a generated thumbnail.
 */
export class ThumbnailImage implements Thumbnail {
  blobUrl: string;
  blob: Blob;
  arrayBuffer: ArrayBuffer;
  timestamp: number;
  videoDuration: number;
  width?: number;
  height?: number;
  isBlack?: boolean;
  method: "native" | "ffmpeg";

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
