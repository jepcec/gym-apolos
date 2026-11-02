"use client";

import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";

interface MembershipType {
  id?: number;
  name: string;
  durationDays: number;
  price: number;
  description: string;
}

interface MembershipTypeModalProps {
  typeId: number | null;
  onClose: () => void;
  onSave: (data: Omit<MembershipType, "id">) => void;
}

export default function MembershipTypeModal({
  typeId,
  onClose,
  onSave,
}: MembershipTypeModalProps) {
  const [name, setName] = useState("");
  const [durationDays, setDurationDays] = useState(30);
  const [price, setPrice] = useState(0);
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (typeId) {
      fetch(`/api/membership-types/${typeId}`)
        .then((res) => res.json())
        .then((data) => {
          setName(data.name || "");
          setDurationDays(data.durationDays || 30);
          setPrice(data.price || 0);
          setDescription(data.description || "");
        })
        .catch(console.error);
    }
  }, [typeId]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), durationDays, price, description });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="card w-full max-w-md">
        <div className="flex items-center justify-between border-b border-[var(--line-soft)] px-6 py-4">
          <h2 className="text-base font-semibold text-ink">
            {typeId ? "Editar plan" : "Nuevo plan de membresía"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="btn btn-ghost rounded !p-2"
          >
            <X className="h-5 w-5 text-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Nombre *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="input"
              placeholder="Ej: Mensual, Trimestral"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Duración (días) *
            </label>
            <input
              type="number"
              value={durationDays}
              onChange={(e) => setDurationDays(parseInt(e.target.value) || 0)}
              required
              min="1"
              className="input"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Precio (S/) *
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              required
              min="0"
              step="0.01"
              className="input"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="input"
              placeholder="Descripción opcional del plan..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              <Save className="h-4 w-4" />
              {typeId ? "Actualizar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
