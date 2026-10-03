import React from 'react';
import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
}

// Colours come from the app's theme variables (index.css), so bubbles follow the in-app
// dark/light switch instead of the operating system's colour scheme.
const KIND: Record<string, { icon: string; label: string }> = { call: { icon: 'fas fa-phone-alt', label: 'Call' }, whatsapp: { icon: 'fab fa-whatsapp', label: 'WhatsApp' }, meeting: { icon: 'fas fa-handshake', label: 'Meeting' }, note: { icon: 'fas fa-sticky-note', label: 'Note' } };
const duration = (sec?: number) => (sec ? ` · ${Math.floor(sec / 60)}m ${sec % 60}s` : '');

/** What the team wrote down for itself (a note, a call, a meeting). It is never sent to the customer, so it does not look like a chat bubble. */
const TeamNote: React.FC<MessageBubbleProps> = ({ message }) => {
  const { content, time, kind, outcome, recordingUrl, recordingName, durationSec } = message;
  const k = KIND[kind || 'note'];
  return (
    <div data-testid="team-note" className="self-center w-full max-w-[34rem] rounded-lg border-l-2 border-amber-500/70 bg-[var(--dark-bg)] px-3 py-2 text-[var(--text-primary)] animate-fadeIn">
      <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-[var(--text-secondary)]">
        <span className="flex items-center gap-1.5 min-w-0">
          <i className={`${k.icon} text-amber-500`} aria-hidden="true"></i>
          <span className="truncate">{k.label}{duration(durationSec)}</span>
          {outcome && <span className="text-[var(--text-primary)]">· {outcome}</span>}
        </span>
        <span className="shrink-0 flex items-center gap-1.5" title="Only your team sees this. It is not sent to the customer."><i className="fas fa-lock text-[9px]" aria-hidden="true"></i>Team only · {time}</span>
      </div>
      {content && <div className="mt-1.5 text-[13px] leading-relaxed whitespace-pre-wrap">{content}</div>}
      {recordingUrl && (
        <div className="mt-2" data-testid="call-recording">
          <audio controls preload="none" src={recordingUrl} className="h-9 max-w-full" aria-label="Call recording"></audio>
          <div className="mt-0.5 text-[10px] text-[var(--text-secondary)] flex items-center gap-2"><i className="fas fa-microphone" aria-hidden="true"></i><span className="truncate">{recordingName || 'Call recording'}</span>{recordingUrl.startsWith('http') && <a href={recordingUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--text-primary)]">Open</a>}</div>
        </div>
      )}
    </div>
  );
};

/** True for what the customer actually sees: their own messages and the WhatsApp messages exchanged with them. */
export const isCustomerChat = (m: Message) => m.sender === 'received' || m.kind === 'whatsapp';

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  if (!isCustomerChat(message)) return <TeamNote message={message} />;
  const { content, time, sender, kind, outcome, recordingUrl, recordingName, waStatus, durationSec } = message;
  const k = kind ? KIND[kind] : undefined;
  const isSent = sender === 'sent';

  return (
    <div
      data-testid="message-bubble"
      className={`max-w-[min(78%,34rem)] px-3.5 py-2 rounded-2xl mb-1 relative animate-fadeIn flex flex-col border text-[var(--text-primary)] ${
        isSent
          ? 'bg-[var(--sent-message)] border-transparent self-end rounded-tr-none'
          : 'bg-[var(--received-message)] border-[var(--border-color)] self-start rounded-tl-none'
      }`}
    >
      {(k || outcome) && (
        <div className="flex items-center gap-1.5 mb-1 text-[10px] font-semibold text-[var(--text-secondary)]">
          {k && <span><i className={`${k.icon} mr-1`} aria-hidden="true"></i>{k.label}{duration(durationSec)}</span>}
          {outcome && <span className="px-1.5 py-px rounded-full bg-black/20 text-[var(--text-primary)]">{outcome}</span>}
        </div>
      )}
      <div className="text-[13px] leading-relaxed whitespace-pre-wrap">{content}</div>
      {recordingUrl && (
        <div className="mt-2" data-testid="call-recording">
          <audio controls preload="none" src={recordingUrl} className="h-9 max-w-full" aria-label="Call recording"></audio>
          <div className="mt-0.5 text-[10px] text-[var(--text-secondary)] flex items-center gap-2"><i className="fas fa-microphone" aria-hidden="true"></i><span className="truncate">{recordingName || 'Call recording'}</span>{recordingUrl.startsWith('http') && <a href={recordingUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--text-primary)]">Open</a>}</div>
        </div>
      )}
      <div className="text-[10px] mt-1 self-end font-medium text-[var(--text-secondary)]">
          {time}
          {isSent && kind === 'whatsapp' && waStatus && (waStatus === 'failed'
            ? <i className="fas fa-exclamation-circle ml-1 text-red-400" title="Not delivered" aria-label="Not delivered"></i>
            : <i className={`fas ${waStatus === 'sent' ? 'fa-check' : 'fa-check-double'} ml-1 ${waStatus === 'delivered' || waStatus === 'sent' ? 'text-gray-400' : 'text-sky-400'}`} title={waStatus ? `WhatsApp: ${waStatus}` : undefined} aria-label={waStatus ? `WhatsApp ${waStatus}` : undefined} data-wa-status={waStatus}></i>)}
      </div>
    </div>
  );
};

export default MessageBubble;
