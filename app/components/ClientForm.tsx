"use client";

import { useState } from "react";
import { Save } from "lucide-react";

export interface ClientFormValues {
  name: string;
  dni: string;
  phone: string;
  email: string;
  birthDate: string; // yyyy-mm-dd o ""
  address: string;
  status?: string;
}

interface ClientFormProps {
  initial?: Partial<ClientFormValues>;
  /** Muestra el selector activo/inactivo (edición). */
  includeStatus?: boolean;
  submitLabel: string;
  autoFocusField?: "name" | "dni";
  /** Devuelve un mensaje de error (p. ej. DNI duplicado) o null si todo fue bien. */
  onSubmit: (values: ClientFormValues) => Promise<string | null>;
  onCancel?: () => void;
}

/**
 * Formulario de cliente compartido por el alta (/clients/new)
 * y la edición (ficha de cliente).
 */
export default function ClientForm({
  initial,
  includeStatus = false,
  submitLabel,
  autoFocusField = "name",
  onSubmit,
  onCancel,
}: ClientFormProps) {
  const [values, setValues] = useState<ClientFormValues>({
    name: "",
    dni: "",
    phone: "",
    email: "",
    birthDate: "",
    address: "",
    status: "active",
    ...initial,
  });
  const [nameError, setNameError] = useState(false);
  const [dniError, setDniError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name } = e.target;
    let value = e.target.value;
    if (name === "dni") {
      value = value.replace(/\D/g, ""); // solo dígitos, conserva ceros a la izquierda
      setDniError(null);
    }
    setValues((prev) => ({ ...prev, [name]: value }));
    if (name === "name") setNameError(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.name.trim()) {
      setNameError(true);
      return;
    }
    if (!/^\d{8}$/.test(values.dni)) {
      setDniError(
        values.dni
          ? "El DNI debe tener exactamente 8 dígitos"
          : "El DNI es obligatorio: será el código de verificación en recepción"
      );
      return;
    }
    setSubmitting(true);
    const error = await onSubmit(values);
    setSubmitting(false);
    if (error) setDniError(error);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-ink">
          Nombre completo *
        </label>
        <input
          type="text"
          name="name"
          value={values.name}
          onChange={handleChange}
          aria-invalid={nameError}
          autoFocus={autoFocusField === "name"}
          className={`input ${nameError ? "!border-[var(--st-exp-fg)]" : ""}`}
          placeholder="Nombre y apellidos"
        />
        {nameError && (
          <p className="mt-1 text-xs" style={{ color: "var(--st-exp-fg)" }}>
            Escribe el nombre del cliente.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">
            DNI *
          </label>
          <input
            type="text"
            name="dni"
            inputMode="numeric"
            autoComplete="off"
            maxLength={8}
            value={values.dni}
            onChange={handleChange}
            aria-required="true"
            aria-invalid={!!dniError}
            autoFocus={autoFocusField === "dni"}
            className={`input font-mono tracking-[0.1em] ${
              dniError ? "!border-[var(--st-exp-fg)]" : ""
            }`}
            placeholder="12345678"
          />
          <p
            className="mt-1 text-xs"
            style={{
              color: dniError ? "var(--st-exp-fg)" : "var(--muted)",
            }}
          >
            {dniError ||
              "8 dígitos. Será el código con el que se identifique en recepción."}
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink">
            Teléfono
          </label>
          <input
            type="tel"
            name="phone"
            value={values.phone}
            onChange={handleChange}
            className="input"
            placeholder="999 999 999"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink">Email</label>
        <input
          type="email"
          name="email"
          value={values.email}
          onChange={handleChange}
          className="input"
          placeholder="email@ejemplo.com"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">
            Fecha de nacimiento
          </label>
          <input
            type="date"
            name="birthDate"
            value={values.birthDate}
            onChange={handleChange}
            className="input"
          />
        </div>

        {includeStatus && (
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Estado
            </label>
            <select
              name="status"
              value={values.status}
              onChange={handleChange}
              className="input"
            >
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink">
          Dirección
        </label>
        <textarea
          name="address"
          value={values.address}
          onChange={handleChange}
          rows={3}
          className="input resize-y"
          placeholder="Calle, número, referencia"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn btn-outline">
            Cancelar
          </button>
        )}
        <button type="submit" disabled={submitting} className="btn btn-primary">
          <Save className="h-4 w-4" />
          {submitting ? "Guardando…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
