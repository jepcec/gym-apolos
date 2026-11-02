/**
 * Marca única de la aplicación (identidad ficticia de demo: FORJA).
 *
 * Para renombrar el producto (p. ej. cada comprador del template),
 * editar solo este archivo y el bloque BRAND en electron/main.js.
 */
export const branding = {
  /** Nombre principal, usado como wordmark. */
  name: "FORJA",
  /** Nombre largo para títulos, README y empaquetado. */
  nameLong: "Forja — Gym & Entrenamiento",
  /** Bajada del wordmark. */
  tagline: "Gym & Entrenamiento",
  /** Descripción corta (metadata, splash). */
  description: "Sistema de gestión para gimnasios",
} as const;
