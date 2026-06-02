import { createWorker, PSM } from 'tesseract.js';

/**
 * Reduce la imagen a un ancho máximo y la pasa a gris con más contraste.
 * A Tesseract le cuesta mucho con fotos enormes y de bajo contraste; este
 * pre-proceso mejora bastante la lectura de tickets.
 */
async function preprocesar(imagen: File | Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(imagen);
  const maxAncho = 1600;
  const escala = bitmap.width > maxAncho ? maxAncho / bitmap.width : 1;
  const w = Math.round(bitmap.width * escala);
  const h = Math.round(bitmap.height * escala);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return imagen;
  ctx.drawImage(bitmap, 0, 0, w, h);

  // Gris + aumento de contraste sencillo.
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const gris = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    const ajustado = gris < 130 ? gris * 0.6 : Math.min(255, gris * 1.25);
    d[i] = d[i + 1] = d[i + 2] = ajustado;
  }
  ctx.putImageData(img, 0, 0);

  return new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b ?? imagen), 'image/png'),
  );
}

/**
 * Lee el texto de una imagen (foto de un ticket) usando Tesseract.js.
 *
 * Todo ocurre EN EL DISPOSITIVO: la imagen nunca se envía a ningún servidor.
 * La primera vez descarga el modelo de idioma (unos MB); después funciona offline.
 *
 * @param imagen  Archivo o blob de la foto.
 * @param onProgress  Callback opcional con el progreso (0..1) para la UI.
 */
export async function leerTicket(
  imagen: File | Blob,
  onProgress?: (progreso: number) => void,
): Promise<string> {
  const procesada = await preprocesar(imagen).catch(() => imagen);

  const worker = await createWorker('spa', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(m.progress);
      }
    },
  });
  try {
    // Un ticket es una columna de texto: este modo va mejor que el automático.
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_BLOCK });
    const { data } = await worker.recognize(procesada);
    return data.text ?? '';
  } finally {
    await worker.terminate();
  }
}
