import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  description,
  confirmLabel = 'Bekräfta',
  cancelLabel = 'Avbryt',
  destructive = false,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-3xl bg-[#F6FBF7] border border-[#D4E4DA] p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                destructive ? 'bg-[#FADAD8] text-[#9E2A2B]' : 'bg-[#D8F3E3] text-[#183D2C]'
              }`}
            >
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-[#141E18]">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#4A5D52] hover:bg-[#E4EFE8] transition-colors"
            aria-label="Stäng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-[#38493F]">{description}</p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="min-h-[44px] rounded-2xl px-5 py-2.5 text-sm font-semibold text-[#2E4035] hover:bg-[#E4EFE8] transition-colors whitespace-nowrap shrink-0"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`min-h-[44px] rounded-2xl px-5 py-2.5 text-sm font-semibold text-white transition-colors whitespace-nowrap shrink-0 ${
              destructive
                ? 'bg-[#9E2A2B] hover:bg-[#7E1F20]'
                : 'bg-[#183D2C] hover:bg-[#102A1E]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
