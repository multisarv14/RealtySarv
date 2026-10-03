import { TelephonyAdapter, WhatsAppAdapter } from './types';
import { simulatorTelephony, simulatorWhatsApp } from './simulator';

// Real vendors (Exotel, Knowlarity, Ozonetel, MyOperator, the WhatsApp Business API or a partner) are added here, one adapter each.
const TELEPHONY: Record<string, TelephonyAdapter> = { simulator: simulatorTelephony };
const WHATSAPP: Record<string, WhatsAppAdapter> = { simulator: simulatorWhatsApp };

export const telephonyFor = (provider: string): TelephonyAdapter => {
  const a = TELEPHONY[provider];
  if (!a) throw new Error(`The telephony provider "${provider}" is not connected yet.`);
  return a;
};
export const whatsappFor = (provider: string): WhatsAppAdapter => {
  const a = WHATSAPP[provider];
  if (!a) throw new Error(`The WhatsApp provider "${provider}" is not connected yet.`);
  return a;
};
