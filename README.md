# Fastevo Uploader

Fastevo Uploader is a robust library designed to simplify the process of uploading content and generating thumbnails in web applications. It provides an easy-to-use API for working with file uploads and performing image manipulation tasks like creating thumbnails from videos or images, all configured for usage in a browser environment. Its primary purpose is to facilitate developers to integrate multimedia handling functionalities within their applications.

## Table of Contents 📑

- [Fastevo Uploader](#fastevo-uploader)
  - [Installation 🔧](#installation-)
  - [Prerequisites 🛠️](#prerequisites-️)
  - [Basic Usage Guide 🚀](#basic-usage-guide-)
  - [API Reference 📚](#api-reference-)
  - [Advanced Examples ⚙️](#advanced-examples-️)

## Installation 🔧

To install Fastevo Uploader, run the following command in your project directory:

```sh
npm install fastevo-uploader
```

```sh
yarn add fastevo-uploader
```

## Basic Usage Guide 🚀

To get started with Fastevo Uploader, here is a simple example:

```javascript
import fastevoUploader from 'fastevo-uploader';

async function uploadFile(file) {
  try {
    const uploadResult = await fastevoUploader.uploadContent({
      file: file,
      multipartUploadToken: 'your-upload-token-here',
      // Other options...
    });

    console.log('Upload successful:', uploadResult);
  } catch (error) {
    console.error('Upload failed:', error);
  }
}
```

## API Reference 📚

Fastevo Uploader provides a set of APIs to manage uploads and thumbnail generation. Here's a list of available methods:

- `uploadContent(request: UploadRequest): Promise<UploadResult>`
  - Initiates the upload process for the content provided in the request object.
- `generateThumbnails(file: File | Blob, options?: ThumbnailOptions): Promise<string[]>`
  - Generates thumbnails for the provided file.
- `pause()`
  - Pauses an ongoing upload.
- `resume()`
  - Resumes a paused upload.
- `abort()`
  - Cancels an ongoing upload.

Each API method has associated types and options which you can use to customize the upload or thumbnail generation.

## Advanced Examples ⚙️

To demonstrate more complex capabilities, you might provide examples of how to integrate Fastevo Uploader within a larger application, how to handle various upload events, and the process of generating multiple thumbnails with different options.

```javascript
// Example of handling upload events
fastevoUploader.on('uploadProgress', (file, progress) => {
  console.log(`Upload progress: ${progress.bytesUploaded} / ${progress.bytesTotal}`);
});

fastevoUploader.on('uploadComplete', (file, result) => {
  console.log('Upload complete:', result);
});

// Example of generating thumbnails
async function createThumbnails(file) {
  // Configuration options for thumbnails
  const thumbnailOptions = {
    numSnapshots: 10,
    format: 'jpg',
  };

  try {
    const thumbnails = await fastevoUploader.generateThumbnails(file, thumbnailOptions);
    console.log('Thumbnails:', thumbnails);
  } catch (error) {
    console.error('Thumbnail generation failed:', error);
  }
}
```
