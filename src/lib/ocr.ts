import Tesseract from 'tesseract.js';

/**
 * Lee el texto de una imagen (foto de un ticket) usando Tesseract.js.
 *
 * Todo ocurre EN EL DISPOSITIVO: la imagen nunca se envía a ningún servidor.
 * La primera vez, Tesseract descarga el modelo de idioma (unos MB) desde un
 * CDN; después queda cacheado y funciona incluso sin conexión.
 *
 * @param imagen  Archivo o blob de la foto.
 * @param onProgress  Callback opcional con el progreso (0..1) para la UI.
 */
export async function leerTicket(
  imagen: File | Blob,
  onProgress?: (progreso: number) => void,
): Promise<string> {
  const { data } = await Tesseract.recognize(imagen, 'spa', {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(m.progress);
      }
    },
  });
  return data.text ?? '';
}
