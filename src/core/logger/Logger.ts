import { LogLevel, LoggerConfig } from "./types";

class Logger {
  private level: LogLevel;

  constructor(config: LoggerConfig) {
    this.level = config.level;
  }

  debug(message: string, ...optionalParams: any[]): void {
    if (["debug"].includes(this.level)) {
      console.debug(`[DEBUG] ${message}`, ...optionalParams);
    }
  }

  info(message: string, ...optionalParams: any[]): void {
    if (["debug", "info"].includes(this.level)) {
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
