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
  const [price, setPrice] = useState<number | "">(0);

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
      price: price === "" ? 0 : price,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-xl bg-white dark:bg-zinc-800 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700 px-6 py-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            {mode === "assign"
              ? "Asignar Membresía"
              : "Renovar Membresía"}
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
              Cliente
            </label>
            <input
              type="text"
              value={clientName || ""}
              disabled
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-700 px-3 py-2 text-zinc-500 dark:text-zinc-400"
            />
          </div>

          {!useCustomDuration ? (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Plan *
              </label>
              <select
                value={selectedTypeId}
                onChange={(e) =>
                  setSelectedTypeId(
                    e.target.value ? parseInt(e.target.value) : ""
                  )
                }
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {membershipTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name} - {type.durationDays} días - S/ {type.price}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Duración personalizada (días) *
              </label>
              <input
                type="number"
                value={customDurationInput}
                onChange={(e) => setCustomDurationInput(e.target.value)}
                required
                min="1"
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="useCustomDuration"
              checked={useCustomDuration}
              onChange={(e) => setUseCustomDuration(e.target.checked)}
              className="rounded border-zinc-300 dark:border-zinc-600"
            />
            <label
              htmlFor="useCustomDuration"
              className="text-sm text-zinc-700 dark:text-zinc-300"
            >
              Usar duración personalizada
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Fecha de inicio *
            </label>
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-zinc-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Precio (S/) *
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={price}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") {
                  setPrice("");
                } else {
                  const num = parseFloat(val);
                  setPrice(isNaN(num) ? "" : num);
                }
              }}
              required
              pattern="^\d*\.?\d{0,2}$"
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
              {mode === "assign" ? "Asignar" : "Renovar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
