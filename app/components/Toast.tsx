"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

export type ToastKind = "success" | "warning" | "error";

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

export function useToasts(timeout = 3500) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<number[]>([]);

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, kind, message }]);
      const t = window.setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== id));
      }, timeout);
      timers.current.push(t);
    },
    [timeout]
  );

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  useEffect(() => {
    const list = timers.current;
    return () => list.forEach((t) => clearTimeout(t));
  }, []);

  return { toasts, push, dismiss };
}

const ICONS = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
} as const;

const KIND_STYLE: Record<ToastKind, { bg: string; fg: string }> = {
  success: { bg: "var(--st-active-bg)", fg: "var(--st-active-fg)" },
  warning: { bg: "var(--st-warn-bg)", fg: "var(--st-warn-fg)" },
  error: { bg: "var(--st-exp-bg)", fg: "var(--st-exp-fg)" },
};

export default function ToastStack({
  toasts,
  dismiss,
}: {
  toasts: Toast[];
  dismiss: (id: number) => void;
}) {
  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const Icon = ICONS[toast.kind];
        const style = KIND_STYLE[toast.kind];
        return (
          <button
            key={toast.id}
            onClick={() => dismiss(toast.id)}
            className="pointer-events-auto flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium shadow-md"
            style={{ background: style.bg, color: style.fg }}
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            {toast.message}
          </button>
        );
      })}
    </div>
  );
}
