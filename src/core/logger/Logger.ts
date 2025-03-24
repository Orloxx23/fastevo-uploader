import { LogLevel, LoggerConfig } from "./types";

class Logger {
  private level: LogLevel;
  private isDebugEnabled: boolean;

  constructor(config: LoggerConfig) {
    this.level = config.level;
    this.isDebugEnabled = config.debug || false; // Default to false
  }

  debug(message: string, ...optionalParams: any[]): void {
    if (this.isDebugEnabled && ["debug"].includes(this.level)) {
      console.debug(`[DEBUG] ${message}`, ...optionalParams);
    }
  }

  info(message: string, ...optionalParams: any[]): void {
    if (["debug", "info"].includes(this.level)) {
      this.isDebugEnabled &&
        console.info(`[INFO] ${message}`, ...optionalParams);
    }
  }

  warn(message: string, ...optionalParams: any[]): void {
    if (["debug", "info", "warn"].includes(this.level)) {
      console.warn(`[WARN] ${message}`, ...optionalParams);
    }
  }

  error(message: string, ...optionalParams: any[]): void {
    console.error(`[ERROR] ${message}`, ...optionalParams);
  }
}

export default Logger;
