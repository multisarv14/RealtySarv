import React from 'react';
import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
}

// Colours come from the app's theme variables (index.css), so bubbles follow the in-app
// dark/light switch instead of the operating system's colour scheme.
const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const { content, time, sender } = message;
  const isSent = sender === 'sent';

  return (
    <div
      className={`max-w-[75%] px-3.5 py-2 rounded-2xl mb-1 relative animate-fadeIn flex flex-col border text-[var(--text-primary)] ${
        isSent
          ? 'bg-[var(--sent-message)] border-transparent self-end rounded-tr-none'
          : 'bg-[var(--received-message)] border-[var(--border-color)] self-start rounded-tl-none'
      }`}
    >
      <div className="text-[13px] leading-relaxed whitespace-pre-wrap">{content}</div>
      <div className="text-[10px] mt-1 self-end font-medium text-[var(--text-secondary)]">
          {time}
          {isSent && <i className="fas fa-check-double ml-1 text-sky-400" aria-hidden="true"></i>}
      </div>
    </div>
  );
};

export default MessageBubble;
