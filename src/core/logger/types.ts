/**
 * Defines the available log levels.
 */
export type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * Configuration interface for the Logger.
 */
export interface LoggerConfig {
  /**
   * The minimum level of logs to output.
   */
  level: LogLevel;
}
