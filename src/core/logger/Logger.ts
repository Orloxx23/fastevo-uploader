import { LogLevel, LoggerConfig } from "./types";

class Logger {
  private level: LogLevel;

  constructor(config: LoggerConfig) {
    this.level = config.level;
  }

  info(message: string, ...optionalParams: any[]): void {
    if (["info"].includes(this.level)) {
      console.info(`[INFO] ${message}`, ...optionalParams);
    }
  }

  warn(message: string, ...optionalParams: any[]): void {
    if (["info", "warn"].includes(this.level)) {
      console.warn(`[WARN] ${message}`, ...optionalParams);
    }
  }

  error(message: string, ...optionalParams: any[]): void {
    console.error(`[ERROR] ${message}`, ...optionalParams);
  }
}

export default Logger;
