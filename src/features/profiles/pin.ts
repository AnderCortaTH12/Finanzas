/**
 * Hash básico de PIN usando Web Crypto (SHA-256 con salt aleatorio).
 *
 * Nota: es un PIN de 4 dígitos para separar perfiles familiares en un
 * dispositivo de confianza, NO una medida de seguridad fuerte. Los datos viven
 * sin cifrar en IndexedDB; cualquiera con acceso físico al dispositivo
 * desbloqueado podría leerlos. El PIN evita que un familiar abra el perfil de
 * otro por error, nada más.
 */

function bufferToHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Genera un salt aleatorio en hex. */
export function generarSalt(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Calcula el hash SHA-256 de salt + pin. */
export async function hashPin(pin: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(salt + pin);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return bufferToHex(digest);
}

/** Verifica un PIN contra el hash y salt almacenados. */
export async function verificarPin(
  pin: string,
  salt: string,
  hash: string,
): Promise<boolean> {
  const calculado = await hashPin(pin, salt);
  return calculado === hash;
}

/** Valida el formato: exactamente 4 dígitos. */
export function esPinValido(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}
