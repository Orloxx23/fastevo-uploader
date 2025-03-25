// modules/upload/UploadManager.ts

import { UploadRequest, UploadResult, UploadProgress } from "./types";
import {
  CustomError,
  UploadError,
  NetworkError,
  TimeoutError,
} from "../../core/errors";
import Logger from "../../core/logger/Logger";
import ThumbnailGenerator from "../thumbnail/ThumbnailGenerator";

class UploadManager {
  private logger: Logger;
  private thumbnailGenerator: ThumbnailGenerator;

  constructor(logger: Logger, thumbnailGenerator: ThumbnailGenerator) {
    this.logger = logger;
    this.thumbnailGenerator = thumbnailGenerator;
  }

  /**
   * Sube contenido usando un UploadRequest.
   * @param request - Objeto de solicitud de subida.
   * @returns Promesa que resuelve con los thumbnails generados.
   */
  async uploadContent(request: UploadRequest): Promise<UploadResult> {
    try {
      // Validar el tipo de archivo antes de proceder
      if (
        !request.file.type.startsWith("video/") &&
        !request.file.type.startsWith("image/") &&
        !request.file.type.startsWith("audio/")
      ) {
        this.logger.warn("Tipo de archivo no soportado.", {
          fileType: request.file.type,
        });
        throw new UploadError(
          "Tipo de archivo no soportado. Solo se permiten videos, imágenes y archivos de audio.",
        );
      }

      this.logger.info("Preparando para subir contenido.", {
        fileName: request.file.name,
      });

      const { url: presignedUrl, postParams } = request.signedUploadObject;

      // 1. Construir FormData para la subida
      const formData = this.buildFormData(postParams, request.file);
      this.logger.debug("FormData construida.", { formData });

      // 2. Subir el archivo a S3 usando XMLHttpRequest con reintentos
      let attempts = 0;
      const maxRetries = 3;
      const delay = (attempt: number) =>
        new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000),
        );

      while (attempts < maxRetries) {
        try {
          await this.uploadToPresignedUrl(
            presignedUrl,
            formData,
            request.onProgress,
          );
          this.logger.info("Subida a S3 exitosa.");
          break;
        } catch (error) {
          attempts++;
          if (attempts < maxRetries) {
            this.logger.warn(`Reintentando subida intento ${attempts}`, {
              error,
            });
            await delay(attempts);
          } else {
            throw error;
          }
        }
      }

      const finalUrl = presignedUrl.split("?")[0];
      let thumbnails: string[] = [];

      // 3. Generar thumbnails si es un video o imagen
      if (request.file.type.startsWith("video/")) {
        thumbnails = await this.generateVideoThumbnails(request.file);
      } else if (request.file.type.startsWith("image/")) {
        thumbnails.push(URL.createObjectURL(request.file));
      }

      return { thumbnails };
    } catch (error: any) {
      this.logger.error("Error durante la subida de contenido.", { error });
      if (error instanceof CustomError) {
        throw error;
      }
      // Envolver errores genéricos
      throw new UploadError("Error al subir contenido.", {
        originalError: error,
      });
    }
  }

  /**
   * Construye el objeto FormData para la subida.
   * @param postParams - Parámetros de la solicitud firmada.
   * @param file - Archivo a subir.
   * @returns Objeto FormData.
   */
  private buildFormData(
    postParams: { [key: string]: string },
    file: File,
  ): FormData {
    const formData = new FormData();
    Object.entries(postParams).forEach(([key, value]) => {
      formData.append(key, value);
    });
    formData.append("file", file);
    return formData;
  }

  /**
   * Sube el archivo a la URL prefirmada.
   * @param url - URL prefirmada para la subida.
   * @param formData - FormData que contiene los parámetros y el archivo.
   * @param onProgress - Callback para el progreso de la subida.
   * @returns Promesa que se resuelve cuando la subida termina.
   */
  private uploadToPresignedUrl(
    url: string,
    formData: FormData,
    onProgress?: (progress: UploadProgress) => void,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url, true);
      xhr.responseType = "text";
      xhr.timeout = 30000; // Tiempo de espera de 30 segundos

      let startTime = Date.now();

      xhr.upload.onprogress = (event: ProgressEvent) => {
        if (event.lengthComputable && onProgress) {
          const percentage = Math.round((event.loaded / event.total) * 100);
          const uploadedBytes = event.loaded;
          const totalBytes = event.total;

          const elapsedTime = (Date.now() - startTime) / 1000; // Segundos
          const speedBps = uploadedBytes / elapsedTime; // Bytes por segundo

          const timeRemaining =
            speedBps > 0 ? (totalBytes - uploadedBytes) / speedBps : 0;

          onProgress({
            percentage,
            uploadedBytes,
            totalBytes,
            speedBps,
            timeRemaining: timeRemaining > 0 ? timeRemaining : 0,
          });
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          this.logger.error(`La subida falló con el estado ${xhr.status}`, {
            status: xhr.status,
          });
          reject(
            new UploadError(`La subida falló con el estado ${xhr.status}`, {
              status: xhr.status,
            }),
          );
        }
      };

      xhr.onerror = () => {
        this.logger.error("Ocurrió un error de red durante la subida");
        reject(new NetworkError("Ocurrió un error de red durante la subida"));
      };

      xhr.ontimeout = () => {
        this.logger.error("La subida excedió el tiempo de espera");
        reject(new TimeoutError("La subida excedió el tiempo de espera"));
      };

      xhr.send(formData);
    });
  }

  /**
   * Genera thumbnails para archivos de video.
   * @param file - Archivo de video.
   * @returns Promesa que se resuelve con un array de URLs de thumbnails.
   */
  private async generateVideoThumbnails(file: File): Promise<string[]> {
    try {
      this.logger.info("Generando thumbnails de video.", {
        fileName: file.name,
      });
      const thumbnails = await this.thumbnailGenerator.generateThumbnails(
        file,
        {
          numSnapshots: 4,
          format: "png",
          method: "ffmpeg",
          thumbnailInterval: 5,
        },
      );
      this.logger.info("Thumbnails generados exitosamente.", { thumbnails });
      return thumbnails.map((thumb) => thumb.blobUrl);
    } catch (error) {
      this.logger.warn("Error al generar thumbnails de video.", { error });
      return [];
    }
  }
}

export default UploadManager;
