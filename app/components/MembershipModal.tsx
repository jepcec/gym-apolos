"use client";

import { useState, useEffect } from "react";
import { X, Save, Calendar } from "lucide-react";

interface MembershipType {
  id: number;
  name: string;
  durationDays: number;
  price: number;
}

interface Membership {
  id?: number;
  clientId?: number;
  typeId?: number;
  startDate: string;
  endDate?: string;
  status?: string;
  price: number;
  type?: MembershipType | null;
}

interface MembershipModalProps {
  mode: "assign" | "renew";
  clientId?: number;
  clientName?: string;
  membership?: Membership;
  membershipTypes: MembershipType[];
  onClose: () => void;
  onSave: (data: {
    clientId: number;
    typeId?: number;
    startDate: string;
    durationDays?: number;
    price: number;
  }) => void;
}

export default function MembershipModal({
  mode,
  clientId,
  clientName,
  membership,
  membershipTypes,
  onClose,
  onSave,
}: MembershipModalProps) {
  const [selectedTypeId, setSelectedTypeId] = useState<number | "">("");
  const [useCustomDuration, setUseCustomDuration] = useState(false);
  const [customDurationInput, setCustomDurationInput] = useState("30");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [price, setPrice] = useState(0);

  useEffect(() => {
    if (mode === "renew" && membership) {
      if (membership.typeId && membership.typeId > 0) {
        setSelectedTypeId(membership.typeId);
      } else {
        setUseCustomDuration(true);
        const days = Math.ceil(
          (new Date(membership.endDate!).getTime() -
            new Date(membership.startDate).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        setCustomDurationInput(String(days));
      }
      setStartDate(membership.startDate.split("T")[0]);
      setPrice(membership.price);
    } else if (mode === "assign") {
      if (membershipTypes.length > 0) {
        setSelectedTypeId(membershipTypes[0].id);
        setPrice(membershipTypes[0].price);
        setCustomDurationInput(String(membershipTypes[0].durationDays));
      }
    }
  }, [mode, membership, membershipTypes]);

  useEffect(() => {
    if (!useCustomDuration && selectedTypeId) {
      const type = membershipTypes.find((t) => t.id === selectedTypeId);
      if (type) setPrice(type.price);
    }
  }, [selectedTypeId, useCustomDuration, membershipTypes]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;

    const data: {
      clientId: number;
      typeId?: number;
      startDate: string;
      durationDays?: number;
      price: number;
    } = {
      clientId,
      startDate,
      price,
    };

    if (useCustomDuration) {
      data.durationDays = parseInt(customDurationInput) || 0;
      data.typeId = 0;
    } else {
      data.typeId = selectedTypeId as number;
    }

    onSave(data);
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
            {mode === "assign" ? "Asignar membresía" : "Renovar membresía"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="btn btn-ghost rounded !p-2"
          >
            <X className="h-5 w-5 text-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Cliente
            </label>
            <input
              type="text"
              value={clientName || ""}
              disabled
              className="input bg-[var(--line-soft)] text-muted"
            />
          </div>

          {!useCustomDuration ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Plan *
              </label>
              <select
                value={selectedTypeId}
                onChange={(e) =>
                  setSelectedTypeId(
                    e.target.value ? parseInt(e.target.value) : ""
                  )
                }
                className="input"
              >
                {membershipTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name} — {type.durationDays} días — S/ {type.price}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Duración personalizada (días) *
              </label>
              <input
                type="number"
                value={customDurationInput}
                onChange={(e) => setCustomDurationInput(e.target.value)}
                required
                min="1"
                className="input"
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="useCustomDuration"
              checked={useCustomDuration}
              onChange={(e) => setUseCustomDuration(e.target.checked)}
              className="h-4 w-4 rounded accent-[var(--ember)]"
            />
            <label htmlFor="useCustomDuration" className="text-sm text-ink">
              Usar duración personalizada
            </label>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Fecha de inicio *
            </label>
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="input"
              />
              <Calendar
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
            </div>
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
              className="input font-mono"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-outline">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              <Save className="h-4 w-4" />
              {mode === "assign" ? "Asignar" : "Renovar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
