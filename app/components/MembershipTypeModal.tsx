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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-xl bg-white dark:bg-zinc-800 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700 px-6 py-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            {typeId ? "Editar Plan" : "Nuevo Plan de Membresía"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700"
          >
            <X className="h-5 w-5 text-zinc-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Ej: Mensual, Trimestral"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Duración (días) *
            </label>
            <input
              type="number"
              value={durationDays}
              onChange={(e) => setDurationDays(parseInt(e.target.value) || 0)}
              required
              min="1"
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Precio ($) *
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              required
              min="0"
              step="0.01"
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Descripción opcional del plan..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
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
