"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  title: string;
  /** Qué va a pasar exactamente. Nombre del objetivo incluido. */
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Eliminar",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="card w-full max-w-sm p-6">
        <div className="mb-3 flex items-center gap-3">
          <div
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
            style={{
              background: "var(--st-exp-bg)",
              color: "var(--st-exp-fg)",
            }}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>
          <h2 id="confirm-title" className="text-base font-semibold text-ink">
            {title}
          </h2>
        </div>
        <p className="mb-6 text-sm leading-relaxed text-muted">{message}</p>
        <div className="flex justify-end gap-2">
          <button ref={cancelRef} onClick={onCancel} className="btn btn-outline">
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="btn"
            style={{
              background: "var(--st-exp-fg)",
              color: "#fff",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
