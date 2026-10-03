import { randomUUID } from 'crypto';
import { TelephonyAdapter, WhatsAppAdapter } from './types';

// A pretend vendor for testing and demos: it behaves like a real one (events arrive later, through the same code path)
// without any account. SIM_SPEED=0.1 makes it ten times faster for tests.
const speed = () => Number(process.env.SIM_SPEED || 1);
const later = (ms: number, fn: () => void) => setTimeout(fn, ms * speed());

export const simulatorTelephony: TelephonyAdapter = {
  async startCall({ callId, emit }) {
    const providerCallId = 'sim-' + randomUUID().slice(0, 8);
    later(500, () => emit({ providerCallId, status: 'ringing' }));
    later(1500, () => emit({ providerCallId, status: 'answered' }));
    // The call "lasts" a few seconds here but reports a realistic length and a recording.
    later(3500, () => emit({ providerCallId, status: 'completed', durationSec: 134, recordingUrl: `/api/simulator/recording/${callId}.wav` }));
    return { providerCallId };
  },
};

export const simulatorWhatsApp: WhatsAppAdapter = {
  async send({ to, emit, autoReply }) {
    const waId = 'wamid.sim.' + randomUUID().slice(0, 10);
    later(600, () => emit({ type: 'status', waId, status: 'delivered' }));
    later(1800, () => emit({ type: 'status', waId, status: 'read' }));
    if (autoReply) later(3000, () => emit({ type: 'inbound', from: to, text: 'Thanks! Please share the price sheet and the floor plan.', waId: 'wamid.sim.' + randomUUID().slice(0, 10) }));
    return { waId };
  },
};

/** A short tone as a WAV file, so the recording player in the Activity feed has something real to play. */
export function simulatorRecording(seconds = 2): Buffer {
  const rate = 8000, n = rate * seconds;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(rate, 24); buf.writeUInt32LE(rate * 2, 28);
  buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) buf.writeInt16LE(Math.round(Math.sin((2 * Math.PI * 440 * i) / rate) * 3000 * (i % 4000 < 2800 ? 1 : 0)), 44 + i * 2);
  return buf;
}
