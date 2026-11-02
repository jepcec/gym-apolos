/**
 * El DNI es el código de verificación del cliente (obligatorio y único).
 * Formato peruano: exactamente 8 dígitos.
 */
export const DNI_RE = /^\d{8}$/;

/** Quita espacios y guiones; respeta ceros a la izquierda. */
export function normalizeDni(raw: unknown): string {
  return String(raw ?? "").replace(/[\s-]/g, "");
}

/** Devuelve un mensaje de error legible o null si el DNI es válido. */
export function validateDni(raw: unknown): string | null {
  const dni = normalizeDni(raw);
  if (!dni) return "El DNI es obligatorio";
  if (!DNI_RE.test(dni)) return "El DNI debe tener exactamente 8 dígitos";
  return null;
}
