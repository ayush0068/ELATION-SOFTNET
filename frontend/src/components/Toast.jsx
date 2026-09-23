import { useEffect } from 'react';

export default function Toast({ toast, onClose, duration = 3200 }) {
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => onClose?.(), duration);
    return () => clearTimeout(t);
  }, [toast, duration, onClose]);

  if (!toast) return null;

  const isError = toast.type === 'error';

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4 sm:justify-end sm:pr-6">
      <div
        className={`animate-toast-in pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 shadow-xl shadow-ink/10 ${
          isError ? 'border-danger/20 bg-surface' : 'border-success/20 bg-surface'
        }`}
      >
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
            isError ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'
          }`}
        >
          {isError ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          )}
        </div>
        <p className="text-sm font-medium text-ink">{toast.message}</p>
        <button
          type="button"
          onClick={onClose}
          className="ml-1 shrink-0 text-muted transition hover:text-ink"
          title="Dismiss"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}