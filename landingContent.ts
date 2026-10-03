// Social proof for the landing page. Add REAL customers here; a section only appears once it has entries.
// Leave both lists empty until you have permission to show names and quotes.

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  company: string;
}

/** Customer quotes, e.g. { quote: '…', name: 'A. Sharma', role: 'Sales Head', company: 'Skyline Developers' } */
export const TESTIMONIALS: Testimonial[] = [];

/** Company names shown in the "Trusted by" strip, e.g. ['Skyline Developers', 'Orchid Realty'] */
export const CLIENTS: string[] = [];

/** Contact details shown in the footer and on the Privacy/Terms pages. Fill in what you want to publish; empty fields are hidden. */
export const CONTACT = {
  email: 'info@multisarv.com',
  phone: '',
  address: '',
};
