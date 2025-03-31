export * from "./modules/upload/types";
export * from "./modules/thumbnail/types";

import { FastevoUploader } from "./fastevoUploader";
const fastevoUploader = new FastevoUploader();

export { fastevoUploader, FastevoUploader };
export default fastevoUploader;
