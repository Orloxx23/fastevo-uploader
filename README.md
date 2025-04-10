# Fastevo Uploader 🚀

Fastevo Uploader is a comprehensive TypeScript library that facilitates file uploads with advanced features like thumbnail generation, handling upload progress, and more. Designed to be used in browser environments, it integrates seamlessly with modern JavaScript applications.

## 🔧 Installation

```bash
npm install fastevo-uploader
# or
yarn add fastevo-uploader
```

## ⚙️ Basic Usage

To use Fastevo Uploader in your project:

```typescript
import fastevoUploader from 'fastevo-uploader';

const file = document.querySelector('input[type="file"]').files[0];
fastevoUploader.uploadContent({
  multipartUploadToken: 'YOUR_UPLOAD_TOKEN',
  file: file,
  generateThumbnails: true
}).then(result => {
  console.log('Upload finished with thumbnails:', result.thumbnails);
}).catch(error => {
  console.error('Upload failed:', error);
});
```

## 📖 API and Main Documentation

### `fastevoUploader.uploadContent(request: UploadRequest): Promise<UploadResult>`

Initiates the content upload process.

- **Params:**
  - `request: UploadRequest` - An object containing the following properties:
    - `multipartUploadToken: string` - Token required for multipart uploads.
    - `file: File` - The file object to upload.
    - `apiUrlBase?: string` - (Optional) Base URL for the upload API.
    - `generateThumbnails?: boolean` - (Optional) Flag indicating whether thumbnails should be generated.
    - `thumbnailOptions?: ThumbnailOptions` - (Optional) Additional options for thumbnail generation.

- **Returns:**
  - `Promise<UploadResult>` - A promise that resolves with an object containing an array of thumbnail URLs if generation was requested.

### `fastevoUploader.generateThumbnails(file: File | Blob, options?: ThumbnailOptions): Promise<string[]>`

Generates thumbnails for a given video or image file.

- **Params:**
  - `file: File | Blob` - The video or image file for which to generate thumbnails.
  - `options?: ThumbnailOptions` - (Optional) Additional settings for thumbnail generation.

- **Returns:**
  - `Promise<string[]>` - A promise that resolves with an array of blob URLs pointing to the generated thumbnails.

### `fastevoUploader.pause(uploadId: string): void`

Pauses an ongoing upload.

- **Params:**
  - `uploadId: string` - The ID of the upload to pause.

### `fastevoUploader.resume(uploadId: string): void`

Resumes a paused upload.

- **Params:**
  - `uploadId: string` - The ID of the upload to resume.

### `fastevoUploader.abort(uploadId: string): void`

Cancels an ongoing upload.

- **Params:**
  - `uploadId: string` - The ID of the upload to cancel.

## ⚙️ Configuration

To configure Fastevo Uploader, you may pass options to the `FastevoUploader` constructor. Further customization can be achieved through `thumbnailOptions` when calling `uploadContent`.

## 🌟 Advanced Examples

TODO: Include complex usage scenarios, callback handling, error management, etc.

## FAQ / Frequently Asked Questions

Q: What environments is Fastevo Uploader compatible with?
A: Fastevo Uploader is designed for use in browser environments and is not intended for Node.js.

Q: Can I upload multiple files simultaneously?
A: Yes, you can create multiple instances of `FastevoUploader` to handle simultaneous uploads.

Q: Is there a file size limit for uploads?
A: The file size limit depends on the backend API you are uploading to. Fastevo Uploader itself does not impose a size limit.

## 🛠 Event Subscriptions

Fastevo Uploader emits various events which you can subscribe to:

- **Events:**
  - `uploadProgress(file: File, progress: UploadProgress)` - Fired during the upload to provide progress updates.
  - `uploadComplete(file: File, result: UploadResult)` - Fired when an upload is completed successfully.
  - `uploadError(file: File, error: Error)` - Fired when there is an error during the upload.
  - `uploadPaused(file: File)` - Fired when an upload is paused.
  - `uploadResumed(file: File)` - Fired when an upload is resumed.
  - `thumbnailsGenerated(file: File, thumbnails: Thumbnail[])` - Fired when thumbnails are successfully generated.

Please refer to the API section above for details on each event and associated types.

## 🗂 Project Structure

```
.
├── .eslintrc.js
├── .prettierrc
├── package.json
├── rollup.config.mjs
├── src
│   ├── core
│   │   ├── environment
│   │   │   └── environment.ts
│   │   ├── errors
│   │   │   ├── CustomErrors.ts
│   │   │   └── index.ts
│   │   └── logger
│   │       ├── Logger.ts
│   │       └── types.ts
│   ├── fastevoUploader.ts
│   ├── index.ts
│   ├── modules
│   │   ├── thumbnail
│   │   │   ├── Thumbnail.ts
│   │   │   ├── ThumbnailGenerator.ts
│   │   │   ├── index.ts
│   │   │   └── types.ts
│   │   └── upload
│   │       ├── UploadManager.ts
│   │       ├── index.ts
│   │       └── types.ts
│   ├── utils
│   │   ├── helpers.ts
│   │   └── index.ts
│   ├── tsconfig.json
│   └── typedoc.json
└── (output files in dist)
```

- **.eslintrc.js** and **.prettierrc**: Configuration files for ESLint and Prettier, ensuring code consistency and styling.
- **package.json**: Contains metadata and dependencies for the project.
- **rollup.config.mjs**: Rollup configuration for building the library.
- **src**: Main source files.
  - **core**: Core functionality.
    - **environment**: Handles environment checks.
    - **errors**: Custom error classes and exports.
    - **logger**: Logging utility.
  - **fastevoUploader.ts**: Main library class orchestrating uploads and thumbnail generation.
  - **index.ts**: Exports the library's public API.
  - **modules**: Specific modules for uploads and thumbnails.
    - **thumbnail**: Handles thumbnail generation.
    - **upload**: Manages uploads and progress events.
  - **utils**: Utility functions such as `objectToFormData`.
  - **tsconfig.json**: TypeScript compiler configuration.
  - **typedoc.json**: TypeDoc configuration for generating documentation.

All source files are written in TypeScript and transpiled to JavaScript during the build process, with the output placed in the `dist` directory.

---

This README was created with the ❤️ by Lyo and Lemos in a creative way.