import React from 'react';
import { CallLog } from '../types';

const ENDED = ['completed', 'no-answer', 'busy', 'failed'];
const mmss = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

/** Shows the call being made from the system, and (after it ends) the call that still has to be written up. */
const CallBar: React.FC<{ leadName: string; active?: CallLog; toLog?: CallLog | null; onLog: () => void }> = ({ leadName, active, toLog, onLog }) => {
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    if (active?.status !== 'answered') return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [active?.status]);

  if (active) {
    const connected = active.status === 'answered';
    const secs = connected && active.answeredAt ? Math.max(0, Math.round((now - new Date(active.answeredAt).getTime()) / 1000)) : 0;
    return (
      <div role="status" data-testid="call-bar" className="mx-3 mt-3 rounded-xl border border-[var(--primary-color)]/40 bg-[color-mix(in_srgb,var(--primary-color)_10%,transparent)] px-4 py-2.5 flex items-center gap-3 animate-fadeIn">
        <span className={`w-9 h-9 rounded-full flex items-center justify-center text-white ${connected ? 'bg-green-500' : 'bg-[var(--primary-color)] animate-pulse'}`}><i className="fas fa-phone-alt text-sm" aria-hidden="true"></i></span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{connected ? `On a call with ${leadName}` : `Calling ${leadName}…`}</p>
          <p className="text-xs text-[var(--text-secondary)]">{active.status === 'initiated' ? 'Connecting to the phone line' : active.status === 'ringing' ? 'Ringing' : `Connected ${mmss(secs)}`}</p>
        </div>
      </div>
    );
  }
  if (toLog && ENDED.includes(toLog.status)) {
    const ok = toLog.status === 'completed';
    return (
      <div role="status" data-testid="call-bar" className="mx-3 mt-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 flex items-center gap-3 animate-fadeIn">
        <span className="w-9 h-9 rounded-full flex items-center justify-center bg-amber-500 text-white"><i className="fas fa-phone-slash text-sm" aria-hidden="true"></i></span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--text-primary)]">{ok ? `Call ended${toLog.durationSec ? ` · ${mmss(toLog.durationSec)}` : ''}${toLog.recordingUrl ? ' · recording ready' : ''}` : toLog.status === 'no-answer' ? 'No answer' : toLog.status === 'busy' ? 'Line was busy' : 'The call did not connect'}</p>
          <p className="text-xs text-[var(--text-secondary)]">Write down what happened and set the next follow-up.</p>
        </div>
        <button type="button" onClick={onLog} className="h-8 px-3 rounded-lg text-xs font-semibold bg-[var(--primary-color)] text-white hover:brightness-110">Write it up</button>
      </div>
    );
  }
  return null;
};

export default CallBar;
