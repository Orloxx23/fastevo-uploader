# 📦 Subelo.js

Uploader is a TypeScript library that allows you to upload files to a platform. It provides a simple and easy-to-use API for uploading files with progress tracking. Uploader is designed to work seamlessly with other services.

## 🚀 Installation

```bash
npm install subelojs
```

## 😲 Simple Usage

To use subelojs for uploading files, first import the uploader and initialize it with your configuration:

```javascript
import subelo from "subelojs";

const uploader = subelo({
  apiKey: "YOUR_API_KEY",
});

const uploadRequest = {
  file: File, // The file object to upload.
  options: {
    title: "My upload",
    folderPath: "my-folder",
    priority: 1,
    watermarkProfile: null, // or your watermark profile.
    tags: ["tag1", "tag2"],
  },
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
