"use client";

import { CheckCircle2, AlertTriangle, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToastItem {
  id: string;
  type: "success" | "error" | "warning";
  message: string;
}

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
};

const STYLES = {
  success: "border-success/30 text-success bg-success-100",
  error: "border-danger/30 text-danger bg-danger-100",
  warning: "border-signal/30 text-signal-600 bg-signal-100",
};

export function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 w-[min(360px,calc(100vw-2.5rem))]">
      {toasts.map((t) => {
        const Icon = ICONS[t.type];
        return (
          <div
            key={t.id}
            role="status"
            className={cn(
              "flex items-start gap-2.5 rounded-md border shadow-panel bg-white px-4 py-3 text-sm animate-in",
              "border-steel-100"
            )}
          >
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-sm",
                STYLES[t.type]
              )}
            >
              <Icon size={14} />
            </span>
            <span className="text-ink flex-1 leading-snug pt-0.5">{t.message}</span>
            <button
              onClick={() => onDismiss(t.id)}
              className="text-steel-500 hover:text-ink shrink-0 mt-0.5"
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
