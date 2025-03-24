import Subelo from "./Subelo";
import { Config } from "./core/config/types";
import { Environment } from "./core/enviorment/enviorment";
import { ConfigError, CustomError, UploadError } from "./core/errors";
import { UploadRequest, UploadResult } from "./modules/upload/types";

/**
 * Type for the callable function of Subelo.
 */
interface SubeloCallable {
  (config: Config): Subelo;
  uploadContent(request: UploadRequest): Promise<UploadResult>;
}

/**
 * Singleton instance of Subelo.
 */
let instance: Subelo | null = null;

/**
 * Main function that initializes Subelo with the provided configuration.
 * @param config - Configuration object.
 * @returns Subelo instance.
 */
const subelo: SubeloCallable = (config: Config): Subelo => {
  if (!instance) {
    // Check the environment before proceeding
    Environment.requireBrowserEnvironment();

    instance = new Subelo(config);
  }
  return instance;
};

/**
 * Static method of uploadContent to use without initializing an instance.
 * @param request - Upload request object.
 * @returns Promise that resolves with the generated thumbnails.
 */
subelo.uploadContent = async (
  request: UploadRequest,
): Promise<UploadResult> => {
  if (!instance) {
    throw new ConfigError("Subelo is not configured yet.");
  }
  return instance.uploadContent(request);
};

export interface SubeloInstance {
  uploadContent(request: UploadRequest): Promise<UploadResult>;
}

declare const subelo: (config: Config) => SubeloInstance;

// Export the Subelo class and relevant types
export default subelo;
export * from "./core/config/types";
export { ConfigError, CustomError, UploadError };
