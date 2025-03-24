export class CustomError extends Error {
  public name: string;
  public details?: any;

  constructor(name: string, message: string, details?: any) {
    super(message);
    this.name = name;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype); // Restore the prototype chain
  }
}

export class ConfigError extends CustomError {
  constructor(message: string, details?: any) {
    super("ConfigError", message, details);
  }
}

export class UploadError extends CustomError {
  constructor(message: string, details?: any) {
    super("UploadError", message, details);
  }
}

export class NetworkError extends CustomError {
  constructor(message: string, details?: any) {
    super("NetworkError", message, details);
  }
}

export class TimeoutError extends CustomError {
  constructor(message: string, details?: any) {
    super("TimeoutError", message, details);
  }
}
