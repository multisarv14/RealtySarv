import React from 'react';

// One look for every LeadSarv form and popup: header with close button, scrolling body, fixed footer.
// Esc closes it; clicking the dark backdrop does NOT (a stray click shouldn't throw away typed data).
// On phones it becomes a bottom sheet.

type Size = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
const SIZES: Record<Size, string> = { sm: 'sm:max-w-sm', md: 'sm:max-w-md', lg: 'sm:max-w-lg', xl: 'sm:max-w-xl', '2xl': 'sm:max-w-2xl', '4xl': 'sm:max-w-4xl' };

export const inputCls = (invalid?: boolean) =>
  `w-full h-10 px-3 rounded-lg border bg-[var(--dark-bg)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none transition-colors focus:ring-2 disabled:opacity-60 ${
    invalid ? 'border-red-500 focus:ring-red-500/30' : 'border-[var(--border-color)] focus:border-[var(--primary-color)] focus:ring-[var(--primary-color)]/25'
  }`;
export const textareaCls = (invalid?: boolean) => `${inputCls(invalid)} h-auto min-h-[76px] py-2 resize-y`;

export const Field: React.FC<{ label: string; htmlFor?: string; required?: boolean; error?: string | null; hint?: string; className?: string; children: React.ReactNode }> = ({ label, htmlFor, required, error, hint, className, children }) => (
  <div className={className}>
    <label htmlFor={htmlFor} className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
      {label}{required && <span className="text-red-500"> *</span>}
    </label>
    {children}
    {error ? <p id={htmlFor ? `${htmlFor}-err` : undefined} role="alert" className="mt-1 text-xs text-red-500 flex items-center gap-1"><i className="fas fa-exclamation-circle" aria-hidden="true"></i>{error}</p>
      : hint ? <p className="mt-1 text-xs text-[var(--text-secondary)]">{hint}</p> : null}
  </div>
);

/** Small titled group inside a form. */
export const Section: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
  <section className={className}>
    <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2.5 pb-1.5 border-b border-[var(--border-color)]">{title}</h4>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">{children}</div>
  </section>
);

/** Pick one (or several) of a few options as chips: faster and clearer than a dropdown. */
export const Chips: React.FC<{ options: string[]; value: string | string[]; onChange: (v: any) => void; multiple?: boolean; label: string }> = ({ options, value, onChange, multiple, label }) => {
  const selected = (o: string) => (Array.isArray(value) ? value.includes(o) : value === o);
  const toggle = (o: string) => {
    if (multiple) { const arr = Array.isArray(value) ? value : []; onChange(arr.includes(o) ? arr.filter(x => x !== o) : [...arr, o]); }
    else onChange(o);
  };
  return (
    <div role={multiple ? 'group' : 'radiogroup'} aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map(o => (
        <button key={o} type="button" role={multiple ? undefined : 'radio'} aria-checked={multiple ? undefined : selected(o)} aria-pressed={multiple ? selected(o) : undefined} onClick={() => toggle(o)}
          className={`h-8 px-3 rounded-full text-xs font-semibold border transition-colors ${selected(o) ? 'bg-[var(--primary-color)] text-white border-transparent' : 'bg-[var(--dark-bg)] text-[var(--text-secondary)] border-[var(--border-color)] hover:text-[var(--text-primary)]'}`}>
          {o}
        </button>
      ))}
    </div>
  );
};

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'primary' | 'success' | 'danger' | 'ghost' }> = ({ tone = 'primary', className = '', children, ...rest }) => {
  const tones = {
    primary: 'bg-[var(--primary-color)] text-white hover:opacity-90',
    success: 'bg-green-600 text-white hover:bg-green-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--light-bg)] hover:text-[var(--text-primary)]',
  };
  return <button {...rest} className={`h-10 px-5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 ${tones[tone]} ${className}`}>{children}</button>;
};

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  size?: Size;
  children: React.ReactNode;
  /** When given, the body and footer are wrapped in a <form> and the primary button submits it. */
  onSubmit?: (e: React.FormEvent) => void;
  submitLabel?: string;
  cancelLabel?: string;
  submitTone?: 'primary' | 'success' | 'danger';
  submitting?: boolean;
  submitDisabled?: boolean;
  /** Message shown at the top of the body (e.g. why a save was refused). */
  error?: string | null;
  /** Replaces the default Cancel / Submit footer. */
  footer?: React.ReactNode;
  formRef?: React.Ref<HTMLFormElement>;
  /** Let the browser run its own required-field checks (multi-step forms that call reportValidity themselves). */
  nativeValidation?: boolean;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, subtitle, size = 'lg', children, onSubmit, submitLabel = 'Save', cancelLabel = 'Cancel', submitTone = 'primary', submitting, submitDisabled, error, footer, formRef, nativeValidation }) => {
  const titleId = React.useId();
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    const opener = document.activeElement as HTMLElement | null;
    const t = window.setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLElement>('[data-autofocus], input:not([type=hidden]):not([disabled]), select:not([disabled]), textarea:not([disabled])');
      (first || panelRef.current)?.focus();
    }, 30);
    return () => { window.clearTimeout(t); opener?.focus?.(); };
  }, [isOpen]);

  // Esc closes the topmost dialog wherever focus is (even after a click on the backdrop).
  const closeRef = React.useRef(onClose);
  closeRef.current = onClose;
  React.useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || submitting) return;
      const overlays = document.querySelectorAll('[data-modal-overlay]');
      if (overlays[overlays.length - 1] === overlayRef.current) { e.stopPropagation(); closeRef.current(); }
    };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [isOpen, submitting]);

  const overlayRef = React.useRef<HTMLDivElement>(null);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !panelRef.current) return;
    const items = [...panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')].filter(el => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  if (!isOpen) return null;

  const body = (
    <>
      <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-5">
        {error && <div role="alert" className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex gap-2"><i className="fas fa-exclamation-circle mt-0.5" aria-hidden="true"></i><span>{error}</span></div>}
        {children}
      </div>
      <div className="shrink-0 px-5 py-3 border-t border-[var(--border-color)] bg-[var(--medium-bg)] flex justify-end gap-2 sm:rounded-b-2xl">
        {footer ?? (
          <>
            <Button type="button" tone="ghost" onClick={onClose} disabled={submitting}>{cancelLabel}</Button>
            {onSubmit && <Button type="submit" tone={submitTone} disabled={submitting || submitDisabled}>{submitting && <i className="fas fa-circle-notch fa-spin" aria-hidden="true"></i>}{submitLabel}</Button>}
          </>
        )}
      </div>
    </>
  );

  return (
    <div ref={overlayRef} data-modal-overlay className="fixed inset-0 z-[100] bg-black/60 flex items-end sm:items-center justify-center sm:p-4 animate-fadeIn" onKeyDown={onKeyDown}
      onMouseDown={(e) => { if (e.target === e.currentTarget) e.preventDefault(); /* keep focus inside the dialog */ }}>
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}
        className={`w-full ${SIZES[size]} max-h-[94vh] sm:max-h-[90vh] flex flex-col bg-[var(--medium-bg)] text-[var(--text-primary)] rounded-t-2xl sm:rounded-2xl border border-[var(--border-color)] shadow-2xl outline-none`}>
        <header className="shrink-0 flex items-start justify-between gap-4 px-5 pt-4 pb-3 border-b border-[var(--border-color)]">
          <div className="min-w-0">
            <h3 id={titleId} className="text-base font-bold leading-tight">{title}</h3>
            {subtitle && <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} disabled={submitting} aria-label="Close" className="h-8 w-8 -mr-2 -mt-1 shrink-0 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--light-bg)] hover:text-[var(--text-primary)]">
            <i className="fas fa-xmark" aria-hidden="true"></i>
          </button>
        </header>
        {onSubmit ? <form ref={formRef} onSubmit={onSubmit} noValidate={!nativeValidation} className="flex flex-col min-h-0 flex-1">{body}</form> : <div className="flex flex-col min-h-0 flex-1">{body}</div>}
      </div>
    </div>
  );
};

export default Modal;
