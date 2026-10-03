import React from 'react';
import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
}

// Colours come from the app's theme variables (index.css), so bubbles follow the in-app
// dark/light switch instead of the operating system's colour scheme.
const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const { content, time, sender, kind, outcome, recordingUrl, recordingName } = message;
  const KIND: Record<string, { icon: string; label: string }> = { call: { icon: 'fa-phone-alt', label: 'Call' }, whatsapp: { icon: 'fa-whatsapp fab', label: 'WhatsApp' }, meeting: { icon: 'fa-handshake', label: 'Meeting' } };
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
          {k && <span><i className={`${k.icon.includes('fab') ? '' : 'fas '}${k.icon} mr-1`} aria-hidden="true"></i>{k.label}</span>}
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
          {isSent && <i className="fas fa-check-double ml-1 text-sky-400" aria-hidden="true"></i>}
      </div>
    </div>
  );
};

export default MessageBubble;
