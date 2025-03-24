import { UploadOptions } from "@/modules/upload/UploadRequest";
import { UploadResponse } from "@/modules/upload/types";
import { Config } from "../config/types";
import { CustomError } from "../errors";
import Logger from "../logger/Logger";
import { API_BASE_URL, ENDPOINTS } from "./constants";

class ApiClient {
  private config: Config;
  private logger: Logger;

  constructor(config: Config) {
    this.config = config;
    this.logger = new Logger({ level: "info" });
  }

  /**
   * Builds the full URL for a given endpoint.
   * @param endpointPath - Relative path of the endpoint.
   * @returns Full URL.
   */
  private buildUrl(endpointPath: string): string {
    const baseUrl = this.config.baseUrl || API_BASE_URL;
    return `${baseUrl.replace(/\/+$/, "")}/${endpointPath.replace(/^\/+/, "")}`;
  }

  /**
   * Performs an upload request.
   * @param options - Upload options.
   * @returns Upload response.
   * @throws CustomError if the request fails.
   */
  async uploadContent(options: UploadOptions): Promise<UploadResponse> {
    this.logger.info("Starting upload request.", { options });
    try {
      const endpointPath = ENDPOINTS.uploadContent;
      const url = this.buildUrl(endpointPath);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        this.logger.error("Upload request failed.", {
          status: response.status,
          statusText: response.statusText,
        });
        throw new CustomError(
          "UploadError",
          "Failed to get signed upload object",
          { status: response.status },
        );
      }

      const data: UploadResponse = await response.json();
      this.logger.info("Upload request successful.", data);
      return data;
    } catch (error: any) {
      this.logger.error("Error in upload request.", { error });
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError("ApiError", error.message, {
        originalError: error,
      });
    }
  }
}

export default ApiClient;
