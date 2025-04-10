// @ts-ignore
import FastevoUploader from "fastevo-mp2-uploader-lib";
import {
  UploadRequest,
  UploadResult as CustomUploadResult,
  UploadProgress,
  UploadEvent,
  UploadListener,
  ActiveUpload,
} from "./types";
import ThumbnailGenerator from "../thumbnail/ThumbnailGenerator";
import Logger from "../../core/logger/Logger";
import EventEmitter from "events";

class UploadManager extends EventEmitter {
  private logger: Logger;
  private thumbnailGenerator: ThumbnailGenerator;
  private uploader?: FastevoUploader;

  constructor(logger: Logger, thumbnailGenerator: ThumbnailGenerator) {
    super();
    this.logger = logger;
    this.thumbnailGenerator = thumbnailGenerator;
  }

  public async uploadContent(
    request: UploadRequest,
  ): Promise<CustomUploadResult> {
    const { multipartUploadToken, file } = request;

    this.uploader = new FastevoUploader(multipartUploadToken, {
      apiUrlBase: request.apiUrlBase || undefined,
    });

    this.uploader.on(
      "uploadProgress",
      (
        file: File,
        progress: {
          uploadStarted: number;
          bytesUploaded: number;
          bytesTotal: number;
        },
      ) => {
        this.emit("uploadProgress", file, progress);
      },
    );

    this.uploader.on("uploadComplete", async (file: File, result: any) => {
      // Generate thumbnails if requested
      if (request.generateThumbnails) {
        this.emit("thumbnailsGenerationStarted", file);

        const thumbnails = await this.thumbnailGenerator.generateThumbnails(
          request.file,
          request.thumbnailOptions,
        );

        this.emit("thumbnailsGenerated", file, thumbnails);
      }

      this.emit("uploadComplete", file, result);
    });

    this.uploader.on("uploadError", (file: File, error: any) => {
      console.error("Upload error:", error);
      this.emit("uploadError", file, error);
    });

    this.uploader.on("uploadPaused", () => {
      this.emit("uploadPaused");
    });

    this.uploader.on("uploadResumed", () => {
      this.emit("uploadResumed");
    });

    try {
      await this.uploader.start(file);
      return { thumbnails: [] };
    } catch (error) {
      this.logger.error("Upload error:", { error });
      throw error;
    }
  }

  public pauseUpload(): void {
    if (this.uploader) {
      this.uploader.pause();
    } else {
      this.logger.warn("No upload in progress to pause. Please start an upload before pausing.");
    }
  }

  public resumeUpload(): void {
    if (this.uploader) {
      this.uploader.resume();
    } else {
      this.logger.warn("No upload in progress to resume. Please start an upload before resuming.");
    }
  }

  public abortUpload(): void {
    if (this.uploader) {
      this.uploader.abort();
      this.uploader = undefined;
    } else {
      this.logger.warn("No upload in progress to abort. Please start an upload before aborting.")
    }
  }
}

export default UploadManager;
