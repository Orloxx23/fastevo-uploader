import { CustomError } from "@/core/errors/CustomErrors";
import { Config } from "./types";

import Logger from "@/core/logger/Logger";

class ConfigManager {
  private config: Config | null = null;
  private logger: Logger;

  constructor() {
    // Default logger configuration
    this.logger = new Logger({ level: "info" });
  }

  /**
   * Sets the configuration for the library.
   * @param userConfig - Configuration object.
   */
  setConfig(userConfig: Config): void {
    if (!userConfig.apiKey) {
      throw new CustomError("ConfigError", "API key is required.");
    }
    this.config = userConfig;
    this.logger.info("Configuration set.", this.config);
  }

  /**
   * Gets the current configuration.
   * @returns The configuration.
   * @throws Error if the configuration is not set.
   */
  getConfig(): Config {
    if (!this.config) {
      this.logger.error(
        "Attempt to get configuration without setting it first.",
      );
      throw new CustomError("ConfigError", "Configuration not set.");
    }
    return this.config;
  }
}

export default new ConfigManager();
