import { Subelo } from "./subelo";
import { Config, UploadRequest } from "./core/types";
import { requireBrowserEnvironment } from "./core/enviorment";

let instance: Subelo | null = null;

interface FastevoCallable {
  (config: Config): Subelo;

  uploadContent(request: UploadRequest): Promise<any>;
}

interface FastevoCallableFunction {
  (config: Config): Subelo;
}

interface FastevoCallable extends FastevoCallableFunction {
  uploadContent(request: UploadRequest): Promise<any>;
}

const subelo: FastevoCallable = (config: Config): Subelo => {
  instance = new Subelo(config);
  return instance;
};

subelo.uploadContent = async (request: UploadRequest): Promise<any> => {
  requireBrowserEnvironment();
  if (!instance) {
    throw new Error("Subelo is not configured yet.");
  }
  return instance.uploadContent(request);
};

export default subelo;
export * from "./core/types";
