import React from 'react';
import Modal from './Modal';

// Replaces window.confirm(): `if (await confirmDialog({...})) { ... }`.
interface ConfirmOptions { title: string; message?: string; confirmLabel?: string; danger?: boolean }
type Pending = ConfirmOptions & { resolve: (ok: boolean) => void };

let show: ((p: Pending) => void) | null = null;

export const confirmDialog = (opts: ConfirmOptions): Promise<boolean> =>
  new Promise((resolve) => {
    if (!show) { resolve(false); return; }
    show({ ...opts, resolve });
  });

/** Mount once next to <Toaster />. */
export const ConfirmHost: React.FC = () => {
  const [pending, setPending] = React.useState<Pending | null>(null);
  React.useEffect(() => { show = setPending; return () => { show = null; }; }, []);
  const done = (ok: boolean) => { pending?.resolve(ok); setPending(null); };
  return (
    <Modal
      isOpen={!!pending}
      onClose={() => done(false)}
      title={pending?.title || ''}
      size="sm"
      onSubmit={(e) => { e.preventDefault(); done(true); }}
      submitLabel={pending?.confirmLabel || 'Confirm'}
      submitTone={pending?.danger ? 'danger' : 'primary'}
    >
      {pending?.message && <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{pending.message}</p>}
    </Modal>
  );
};
