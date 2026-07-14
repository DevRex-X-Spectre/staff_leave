'use client';

import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';

/* -------------------------------------------------------------------------
   Dialog - minimal accessible modal using native <dialog>.
   ------------------------------------------------------------------------- */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open) {
      d.showModal();
    } else {
      d.close();
    }
  }, [open]);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === ref.current) onClose();
  };

  return (
    <dialog
      ref={ref}
      onClick={handleBackdropClick}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className={cn(
        'p-0 border-0 bg-transparent text-[var(--text-primary)]',
        'w-[min(90vw,38rem)] max-w-[calc(100vw-1rem)]',
        'mx-auto my-auto overflow-visible',
        'shadow-none'
      )}
    >
      <div
        className={cn(
          'bg-[var(--bg-card)] rounded-[var(--radius-xl)] shadow-[var(--shadow-floating)]',
          'border border-[var(--border-subtle)]',
          'max-h-[85vh] overflow-y-auto',
          'p-4 sm:p-6',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0 flex-1 text-center">
            {title && (
              <h2 className="text-[18px] font-semibold text-[var(--text-primary)] text-center">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-[13px] text-[var(--text-secondary)] mt-0.5 text-center">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className={cn(
              'p-1.5 rounded-[var(--radius-md)] text-[var(--text-secondary)]',
              'hover:bg-[var(--bg-hover)] transition-colors',
              'shrink-0'
            )}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}

/* -------------------------------------------------------------------------
   ConfirmDialog - dialog with a clear destructive / confirm action pattern.
   ------------------------------------------------------------------------- */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
}) {
  return (
    <Dialog open={open} onClose={onClose} title={title} description={description}>
      <div className="flex items-center justify-end gap-3 mt-6">
        <button
          onClick={onClose}
          className={cn(
            'px-5 py-2 rounded-[var(--radius-pill)]',
            'border border-[var(--border-subtle)] text-[var(--text-primary)]',
            'text-[14px] font-medium hover:bg-[var(--bg-hover)] transition-colors',
            'disabled:opacity-50'
          )}
          disabled={loading}
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={cn(
            'px-5 py-2 rounded-[var(--radius-pill)] text-white text-[14px] font-medium',
            'transition-opacity disabled:opacity-50',
            variant === 'danger' ? 'bg-[var(--danger)] hover:opacity-90' : 'bg-[var(--ink)] hover:bg-[#2a2a2a]'
          )}
        >
          {loading ? 'Processing...' : confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
