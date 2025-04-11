import { LogLevel, LoggerConfig } from "./types";

/**
 * Logger class for structured and configurable logging.
 */
class Logger {
  private level: LogLevel;

  constructor(config: LoggerConfig) {
    this.level = config.level;
  }

  /**
   * Logs an informational message.
   * @param message - The message to log.
   * @param optionalParams - Additional parameters.
   */
  info(message: string, ...optionalParams: any[]): void {
    if (["debug", "info"].includes(this.level)) {
      console.info(`[INFO] ${message}`, ...optionalParams);
    }
  }

  /**
   * Logs a debug message.
   * @param message - The message to log.
   * @param optionalParams - Additional parameters.
   */
  debug(message: string, ...optionalParams: any[]): void {
    if (["debug"].includes(this.level)) {
      console.debug(`[DEBUG] ${message}`, ...optionalParams);
    }
  }

  /**
   * Logs a warning message.
   * @param message - The message to log.
   * @param optionalParams - Additional parameters.
   */
  warn(message: string, ...optionalParams: any[]): void {
    if (["debug", "info", "warn"].includes(this.level)) {
      console.warn(`[WARN] ${message}`, ...optionalParams);
    }
  }

  /**
   * Logs an error message.
   * @param message - The message to log.
   * @param optionalParams - Additional parameters.
   */
  error(message: string, ...optionalParams: any[]): void {
    console.error(`[ERROR] ${message}`, ...optionalParams);
  }
}

export default Logger;
