// What every telephony / WhatsApp provider is turned into, so the rest of the app never cares which vendor is behind it.
export type CallStatus = 'initiated' | 'ringing' | 'answered' | 'completed' | 'no-answer' | 'busy' | 'failed';

export interface CallEvent {
  providerCallId: string;
  status: Exclude<CallStatus, 'initiated'>;
  durationSec?: number;
  recordingUrl?: string;
}

export type WhatsAppEvent =
  | { type: 'inbound'; from: string; text: string; waId: string }
  | { type: 'status'; waId: string; status: 'delivered' | 'read' | 'failed' };

export interface IntegrationSettings {
  id: 'main';
  webhookSecret: string;
  telephony: { enabled: boolean; provider: string };
  whatsapp: { enabled: boolean; provider: string; enforceWindow?: boolean; simulatorAutoReply?: boolean };
}

export interface TelephonyAdapter {
  /** Start a click-to-call: the vendor rings the agent first, then the customer. Events come back through handleCallEvent. */
  startCall(ctx: { callId: string; agentPhone: string; customerPhone: string; emit: (e: CallEvent) => void }): Promise<{ providerCallId: string }>;
}

export interface WhatsAppAdapter {
  send(ctx: { to: string; text: string; emit: (e: WhatsAppEvent) => void; autoReply: boolean }): Promise<{ waId: string }>;
}
