"use client";

import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-4">
      <div className="bg-white rounded-md shadow-panel max-w-sm w-full p-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-danger-100 text-danger mb-3">
          <AlertTriangle size={17} />
        </div>
        <div className="font-display font-semibold text-ink text-base">{title}</div>
        <p className="text-sm text-steel-500 mt-1.5">{description}</p>
        <div className="flex items-center justify-end gap-2 mt-5">
          <button
            onClick={onCancel}
            className="rounded-sm px-3.5 py-2 text-sm font-medium text-steel-700 hover:bg-fog-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-sm bg-danger hover:bg-danger/90 text-white px-3.5 py-2 text-sm font-medium transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
