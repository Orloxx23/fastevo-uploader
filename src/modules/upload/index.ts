/**
 * @file Uploads a file to S3 using a presigned POST request.
 * @description This module uploads a file to S3 using a presigned POST request.
 */

import { API_URL } from "@/lib/constants/api";
import ThumbnailGenerator from "@/modules/thumbnail";
import { UploadOptions, UploadResponse } from "./types";
import { Config } from "@/core/types";

export interface UploadProps {
  config: Config;
  file: File;
  options: UploadOptions;
  onProgress?: (progress: {
    percentage: number;
    uploadedBytes: number;
    totalBytes: number;
    speedBps: number;
    timeRemaining: number;
  }) => void;
}

/**
 * Uploads a file to S3 using a presigned POST request.
 * After a successful upload, if the file is a video (or image),
 * it generates thumbnails using the thumbnail module.
 *
 * @param config - Configuration for the upload.
 * @param file - The file to be uploaded.
 * @param options - Details for the upload (title, folderPath, etc).
 * @param onProgress - Optional callback that receives the upload progress (0-100%).
 * @returns A promise that resolves with an object containing the final URL and thumbnails.
 */
/**
 * Uploads a file to S3 using a presigned POST request.
 * Tracks progress, speed, time remaining, and uploaded size.
 */
export function uploadContent({
  config,
  file,
  options,
  onProgress,
}: UploadProps): Promise<{ thumbnails: string[] }> {
  const { apiKey, baseUrl } = config;

  if (!apiKey) {
    throw new Error("Configuration not set.");
  }

  const API_BASE_URL = baseUrl || API_URL;

  return new Promise(async (resolve, reject) => {
    const res = await fetch(
      `${API_BASE_URL}/api/v1/projects/mediaProtection/contents/upload`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(options),
      }
    );

    if (!res.ok) {
      reject(new Error("Failed to get signed upload object"));
      return;
    }

    const data: UploadResponse = await res.json();
    const { url: presignedUrl, postParams } = data.signedUploadObject;

    const formData = new FormData();
    Object.entries(postParams).forEach(([key, value]) => {
      formData.append(key, value);
    });
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", presignedUrl, true);
    xhr.responseType = "text";

    let startTime = Date.now();
    let lastUploaded = 0;

    xhr.upload.onprogress = (event: ProgressEvent) => {
      if (event.lengthComputable && onProgress) {
      const percentage = Math.round((event.loaded / event.total) * 100);
      const uploadedBytes: number = event.loaded;
      const totalBytes: number = event.total;

      const elapsedTime = (Date.now() - startTime) / 1000; // Time in seconds
      const speedBps = event.loaded / elapsedTime; // Bytes per second

      const timeRemaining =
        speedBps > 0 ? (event.total - event.loaded) / speedBps : 0; // seconds

      onProgress({
        percentage,
        uploadedBytes,
        totalBytes,
        speedBps,
        timeRemaining: timeRemaining > 0 ? timeRemaining : 0,
      });
      }
    };

    xhr.onload = async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const finalUrl = presignedUrl.split("?")[0];
        let thumbnails: string[] = [];

        if (file.type.startsWith("video/")) {
          try {
            const generatedThumbnails =
              await ThumbnailGenerator.generateThumbnails(file, {
                numSnapshots: 4,
                format: "png",
                method: "ffmpeg",
                thumbnailInterval: 5,
              });
            thumbnails = generatedThumbnails.map((thumb) => thumb.blobUrl);
          } catch (err) {
            console.warn("Error generating video thumbnails:", err);
          }
        } else if (file.type.startsWith("image/")) {
          thumbnails.push(URL.createObjectURL(file));
        }

        resolve({ thumbnails });
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () =>
      reject(new Error("Network error occurred during upload"));
    xhr.ontimeout = () => reject(new Error("Upload timed out"));

    xhr.send(formData);
  });
}
