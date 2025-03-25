// subelo.ts

import Logger from "./core/logger/Logger";
import ThumbnailGenerator from "./modules/thumbnail/ThumbnailGenerator";
import UploadManager from "./modules/upload/UploadManager";
import { UploadRequest, UploadResult } from "./modules/upload/types";

/**
 * Clase principal que orquesta los diferentes módulos de Subelo.js.
 * Implementada como un Singleton para facilitar su uso.
 */
class Subelo {
  private uploadManager: UploadManager;
  private thumbnailGenerator: ThumbnailGenerator;
  private logger: Logger;

  constructor(debug: boolean = false) {
    this.logger = new Logger({
      level: debug ? "debug" : "info",
      debug: debug,
    });
    this.thumbnailGenerator = new ThumbnailGenerator(this.logger);
    this.uploadManager = new UploadManager(
      this.logger,
      this.thumbnailGenerator,
    );

    // Precargar FFmpeg si es necesario
    this.thumbnailGenerator
      .preloadFFmpeg()
      .then((preloaded) => {
        if (preloaded) {
          this.logger.info("FFmpeg precargado exitosamente.");
        } else {
          this.logger.warn("Falló la precarga de FFmpeg.");
        }
      })
      .catch((err) => {
        this.logger.error("Error durante la precarga de FFmpeg.", {
          error: err,
        });
      });
  }

  /**
   * Sube contenido utilizando la configuración establecida.
   * @param request - Objeto de solicitud de subida.
   * @returns Promesa que se resuelve con los thumbnails generados.
   */
  async uploadContent(request: UploadRequest): Promise<UploadResult> {
    return this.uploadManager.uploadContent(request);
  }
}

// Crear una única instancia de Subelo que será exportada por defecto
const subeloInstance = new Subelo();

// Exportar la instancia como exportación predeterminada
export default subeloInstance;
