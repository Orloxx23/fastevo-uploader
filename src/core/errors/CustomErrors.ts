/**
 * Base class for custom errors in the library.
 */
export class CustomError extends Error {
  public name: string;
  public details?: any;

  constructor(name: string, message: string, details?: any) {
    super(message);
    this.name = name;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype); // Restore prototype chain
  }
}

/**
 * Error related to configuration issues.
 */
export class ConfigError extends CustomError {
  constructor(message: string, details?: any) {
    super("ConfigError", message, details);
  }
}

/**
 * Error occurring during the upload process.
 */
export class UploadError extends CustomError {
  constructor(message: string, details?: any) {
    super("UploadError", message, details);
  }
}

/**
 * Error related to network issues.
 */
export class NetworkError extends CustomError {
  constructor(message: string, details?: any) {
    super("NetworkError", message, details);
  }
}

/**
 * Error caused by a timeout.
 */
export class TimeoutError extends CustomError {
  constructor(message: string, details?: any) {
    super("TimeoutError", message, details);
  }
}
