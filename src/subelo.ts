import { Config, UploadRequest } from "./core/types";
import { uploadContent } from "./modules/upload";

export class Subelo {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  // Upload content using the config
  public async uploadContent({
    file,
    options,
    onProgress,
  }: UploadRequest): Promise<any> {
    return uploadContent({
      config: this.config,
      file,
      options,
      onProgress,
    });
  }
}
