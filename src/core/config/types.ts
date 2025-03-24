export interface Config {
  apiKey: string;
  baseUrl?: string;
  debug?: boolean;
}

export interface UploadOptions {
  title?: string;
  folderPath: string;
  priority: number;
  watermarkProfile: string | null;
  tags?: string[];
}
