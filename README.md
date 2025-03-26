# 📦 Subelo.js

Subelo is a TypeScript library that allows you to upload files to a platform. It provides a simple and easy-to-use API for uploading files with progress tracking.

## 🚀 Installation

```bash
npm install subelojs
```

## 😲 Simple Usage

To use subelojs for uploading files, first import the uploader and initialize it with your configuration:

```javascript
import subelo from "subelojs";

const uploadRequest = {
  file: File, // The file object to upload.
  signedUploadObject:{
    url: string, // The URL to upload the file to.
    postParams: { [key: string]: string }, // The params to include in the upload request.
  }
  onProgress: (progress) => {
    /*
      progress: {
        percentage: number; // The percentage of the upload progress.
        uploadedBytes: number; // The total uploaded Bytes.
        totalBytes: number; // The total file size in Bytes.
        speedBps: number; // The upload speed in Bytes per second.
        timeRemaining: number; // The estimated time remaining in seconds.
      }
    */
    console.log(`Upload progress: ${progress.percentage}%`);
  },
};

uploader
  .uploadContent(uploadRequest)
  .then((response) => {
    console.log("Uploaded successfully:", response.thumbnails);
  })
  .catch((error) => {
    console.error("Upload failed:", error);
  });
```

## ❓ FAQ / Frequently Asked Questions

**Q: Does subelojs support Node.js backends?**

A: No, subelojs is designed to work only in browser environments as it relies on browser-specific APIs for its functionality.
