import { Config } from "@/core/types";

let config: Config | null = null;

/**
 * Sets the configuration to be used by the library.
 *
 * @param userConfig - The configuration object.
 */
export const setConfig = (userConfig: Config): void => {
  config = userConfig;
};

/**
 * Retrieves the configuration object.
 *
 * @returns The configuration object.
 */
export const getConfig = (): Config => {
  if (!config) {
    throw new Error("Configuration not set.");
  }
  return config;
};
