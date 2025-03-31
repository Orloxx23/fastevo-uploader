# Fastevo Uploader

**FastevoUploader** is a robust and flexible JavaScript/TypeScript library designed to handle file uploads with advanced features such as thumbnail generation. Whether you're uploading videos, images, or audio files, FastevoUploader simplifies the process, providing seamless integration and powerful tools to enhance your application's upload capabilities.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Getting Started](#getting-started)
  - [Basic Upload](#basic-upload)
  - [Upload with Thumbnail Generation](#upload-with-thumbnail-generation)
  - [Preloading FFmpeg](#preloading-ffmpeg)
  - [Handling Upload Progress](#handling-upload-progress)
- [API Reference](#api-reference)
  - [FastevoUploader Class](#fastevouploader-class)
  - [UploadRequest](#uploadrequest)
  - [UploadResult](#uploadresult)
  - [ThumbnailOptions](#thumbnailoptions)
- [Environment Requirements](#environment-requirements)

## Features

- **Seamless File Uploads**: Upload videos, images, and audio files effortlessly.
- **Thumbnail Generation**: Automatically generate thumbnails for video files using native methods or FFmpeg.
- **FFmpeg Integration**: Optionally preload FFmpeg to optimize thumbnail generation performance.
- **Progress Tracking**: Monitor upload progress with detailed callbacks.
- **Error Handling**: Comprehensive error management with custom error classes.
- **Retry Mechanism**: Built-in retry logic with exponential backoff for resilient uploads.
- **Environment Verification**: Ensures compatibility with browser environments.

## Installation

You can install FastevoUploader via npm:

```bash
npm install fastevoUploader
```

Or using yarn:

```bash
yarn add fastevoUploader
```

## Getting Started

### Importing the Library

```javascript
import fastevoUploader from "fastevoUploader";
```

### Basic Upload

Here's a simple example of how to upload a file without thumbnail generation:

```javascript
import fastevoUploader from "fastevoUploader";

// Assuming you have a file input in your HTML
const fileInput = document.getElementById("file-input");

fileInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];

  const uploadRequest = {
    file,
    signedUploadObject: {
      url: "https://your-s3-presigned-url.com/upload",
      postParams: {
        bucket: "your-bucket-name",
        "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
        "X-Amz-Credential": "YOUR_CREDENTIAL",
        "X-Amz-Date": "20231010T000000Z",
        key: "your-file-key",
        Policy: "your-policy",
        "X-Amz-Signature": "your-signature",
        "X-Amz-Storage-Class": "STANDARD",
      },
    },
  };

  try {
    const result = await fastevoUploader.uploadContent(uploadRequest);
    console.log("Upload successful:", result);
  } catch (error) {
    console.error("Upload failed:", error);
  }
});
```

### Upload with Thumbnail Generation

To upload a video file and generate thumbnails, set the `generateThumbnails` flag to `true`:

```javascript
import fastevoUploader from "fastevoUploader";

const fileInput = document.getElementById("file-input");

fileInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];

  const uploadRequest = {
    file,
    signedUploadObject: {
      url: "https://your-s3-presigned-url.com/upload",
      postParams: {
        bucket: "your-bucket-name",
        "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
        "X-Amz-Credential": "YOUR_CREDENTIAL",
        "X-Amz-Date": "20231010T000000Z",
        key: "your-file-key",
        Policy: "your-policy",
        "X-Amz-Signature": "your-signature",
        "X-Amz-Storage-Class": "STANDARD",
      },
    },
    generateThumbnails: true,
    thumbnailOptions: {
      numSnapshots: 5,
      format: "png",
      method: "auto", // 'native' | 'ffmpeg' | 'auto'
      intervalType: "automatic", // 'manual' | 'automatic'
      thumbnailInterval: 10, // Used if intervalType is 'manual'
    },
    onProgress: (progress) => {
      console.log(`Progress: ${progress.percentage}%`);
    },
    onThumbnailsComplete: (thumbnails) => {
      console.log("Thumbnails generated:", thumbnails);
    },
  };

  try {
    const result = await fastevoUploader.uploadContent(uploadRequest);
    console.log("Upload successful with thumbnails:", result);
  } catch (error) {
    console.error("Upload failed:", error);
  }
});
```

### Preloading FFmpeg

Preloading FFmpeg can enhance the performance of thumbnail generation by loading FFmpeg in advance:

```javascript
import { FastevoUploader } from "fastevoUploader";

// Initialize with preloading FFmpeg
const uploader = new FastevoUploader({ preload: true });

// Later in your code
const uploadRequest = {
  /* ... */
};
uploader
  .uploadContent(uploadRequest)
  .then((result) => console.log(result))
  .catch((error) => console.error(error));
```

### Handling Upload Progress

Monitor the upload progress and handle different statuses:

```javascript
import fastevoUploader from "fastevoUploader";

const uploadRequest = {
  file: yourFile,
  signedUploadObject: {
    /* ... */
  },
  generateThumbnails: true,
  onProgress: (progress) => {
    console.log(`Status: ${progress.status}`);
    console.log(`Uploaded: ${progress.uploadedBytes} / ${progress.totalBytes}`);
    console.log(`Speed: ${progress.speedBps} Bps`);
    console.log(`Time Remaining: ${progress.timeRemaining} seconds`);
  },
  onThumbnailsComplete: (thumbnails) => {
    console.log("Thumbnails:", thumbnails);
  },
};

fastevoUploader
  .uploadContent(uploadRequest)
  .then((result) => console.log("Upload Result:", result))
  .catch((error) => console.error("Error:", error));
```

## API Reference

### `FastevoUploader` Class

The main class that orchestrates the upload and thumbnail generation processes.

#### Constructor

```typescript
new FastevoUploader(options?: { preload?: boolean })
```

- **options.preload**: Optional boolean to preload FFmpeg upon initialization.

#### Methods

- **uploadContent(request: UploadRequest): Promise<UploadResult>**
  - Uploads the specified content based on the provided request.
- **generateThumbnails(file: File | Blob, options?: ThumbnailOptions): Promise<string[]>**
  - Generates thumbnails for the given file with optional settings.

### `UploadRequest`

Defines the structure of the upload request.

```typescript
interface UploadRequest {
  file: File;
  signedUploadObject: SignedUploadObject;
  generateThumbnails?: boolean;
  thumbnailOptions?: ThumbnailOptions;
  onProgress?: (progress: UploadProgressExtended) => void;
  onThumbnailsComplete?: (thumbnails: string[]) => void;
}
```

- **file**: The file to be uploaded.
- **signedUploadObject**: Pre-signed URL and parameters for the upload.
- **generateThumbnails**: Whether to generate thumbnails post-upload.
- **thumbnailOptions**: Configuration options for thumbnail generation.
- **onProgress**: Callback for upload progress updates.
- **onThumbnailsComplete**: Callback once thumbnails are generated.

### `UploadResult`

Provides the result of the upload operation.

```typescript
interface UploadResult {
  thumbnails: string[];
}
```

- **thumbnails**: Array of URLs pointing to the generated thumbnails.

### `ThumbnailOptions`

Configuration options for thumbnail generation.

```typescript
interface ThumbnailOptions {
  numSnapshots?: number;
  format?: "png" | "jpg";
  method?: "auto" | "native" | "ffmpeg";
  thumbnailInterval?: number;
  intervalType?: "manual" | "automatic";
}
```

- **numSnapshots**: Number of thumbnails to generate.
- **format**: Image format of thumbnails ('png' or 'jpg').
- **method**: Thumbnail generation method ('auto', 'native', or 'ffmpeg').
- **thumbnailInterval**: Interval in seconds between thumbnails (used if `intervalType` is 'manual').
- **intervalType**: Defines how thumbnail intervals are calculated ('manual' or 'automatic').

## Environment Requirements

FastevoUploader is designed to work in browser environments with the following APIs:

- `File`
- `Blob`
- `FormData`
- `XMLHttpRequest`
- `HTMLVideoElement`
- `Canvas`

### Verifying the Environment

FastevoUploader includes an `Environment` class to verify if the code is running in a compatible browser environment.

```javascript
import { Environment } from "fastevoUploader";

if (Environment.isBrowser()) {
  // Safe to use FastevoUploader
} else {
  console.error("FastevoUploader requires a browser environment.");
}
```

---

## Example Projects

To help you get started, here are some example projects demonstrating how to integrate and use FastevoUploader in different scenarios.

### Example 1: Basic File Upload

```javascript
import fastevoUploader from "fastevoUploader";

const uploadButton = document.getElementById("upload-button");

uploadButton.addEventListener("click", () => {
  const fileInput = document.getElementById("file-input");
  const file = fileInput.files[0];

  const uploadRequest = {
    file,
    signedUploadObject: {
      url: "https://your-s3-presigned-url.com/upload",
      postParams: {
        /* ... */
      },
    },
    onProgress: (progress) => {
      console.log(`Upload Progress: ${progress.percentage}%`);
    },
  };

  fastevoUploader
    .uploadContent(uploadRequest)
    .then((result) => console.log("Upload Successful:", result))
    .catch((error) => console.error("Upload Error:", error));
});
```

### Example 2: Upload with Thumbnail Generation and FFmpeg Preloading

```javascript
import { FastevoUploader } from "fastevoUploader";

const uploader = new FastevoUploader({ preload: true });

const fileInput = document.getElementById("file-input");

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];

  const uploadRequest = {
    file,
    signedUploadObject: {
      url: "https://your-s3-presigned-url.com/upload",
      postParams: {
        /* ... */
      },
    },
    generateThumbnails: true,
    thumbnailOptions: {
      numSnapshots: 3,
      format: "jpg",
      method: "ffmpeg",
      intervalType: "manual",
      thumbnailInterval: 15,
    },
    onProgress: (progress) => {
      console.log(
        `Status: ${progress.status}, Progress: ${progress.percentage}%`,
      );
    },
    onThumbnailsComplete: (thumbnails) => {
      console.log("Thumbnails:", thumbnails);
    },
  };

  uploader
    .uploadContent(uploadRequest)
    .then((result) => console.log("Upload with Thumbnails:", result))
    .catch((error) => console.error("Upload Error:", error));
});
```
