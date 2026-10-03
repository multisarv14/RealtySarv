import React from 'react';

// Small non-blocking messages that replace the browser's alert() boxes.
type Tone = 'success' | 'error' | 'info';
interface ToastItem { id: number; message: string; tone: Tone }

const listeners = new Set<(t: ToastItem) => void>();
let nextId = 1;
const emit = (message: string, tone: Tone) => listeners.forEach((l) => l({ id: nextId++, message, tone }));

export const toast = {
  success: (message: string) => emit(message, 'success'),
  error: (message: string) => emit(message, 'error'),
  info: (message: string) => emit(message, 'info'),
};

const STYLE: Record<Tone, { icon: string; bar: string }> = {
  success: { icon: 'fa-check-circle text-green-500', bar: 'border-green-500/40' },
  error: { icon: 'fa-exclamation-circle text-red-500', bar: 'border-red-500/40' },
  info: { icon: 'fa-info-circle text-sky-500', bar: 'border-sky-500/40' },
};

/** Mount once near the root of the screen that shows toasts. */
export const Toaster: React.FC = () => {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  React.useEffect(() => {
    const onToast = (t: ToastItem) => {
      setItems((prev) => [...prev.slice(-3), t]);
      window.setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== t.id)), t.tone === 'error' ? 7000 : 4500);
    };
    listeners.add(onToast);
    return () => { listeners.delete(onToast); };
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] w-[min(92vw,26rem)] flex flex-col gap-2" role="status" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border bg-[var(--medium-bg)] text-[var(--text-primary)] shadow-2xl animate-fadeIn ${STYLE[t.tone].bar}`}>
          <i className={`fas ${STYLE[t.tone].icon} mt-0.5`} aria-hidden="true"></i>
          <p className="flex-1 text-sm leading-snug">{t.message}</p>
          <button type="button" onClick={() => setItems((prev) => prev.filter((x) => x.id !== t.id))} aria-label="Dismiss" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><i className="fas fa-xmark" aria-hidden="true"></i></button>
        </div>
      ))}
    </div>
  );
};
