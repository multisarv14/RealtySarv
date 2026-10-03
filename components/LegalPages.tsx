import React from 'react';
import { CONTACT } from '../landingContent';

// Plain-language drafts that describe what RealtySarv actually does. Have your legal adviser review and adapt them
// (especially retention, governing-law/jurisdiction and liability wording) before relying on them.
const COMPANY = 'MultiSarv Pvt.Ltd';
const UPDATED = '3 October 2026';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mb-9">
    <h2 className="text-xl font-bold text-[#202124] mb-3">{title}</h2>
    <div className="space-y-3 text-[15px] leading-relaxed text-[#3c4043]">{children}</div>
  </section>
);

const ContactLine: React.FC = () => {
  const parts = [CONTACT.email && `Email: ${CONTACT.email}`, CONTACT.phone && `Phone: ${CONTACT.phone}`, CONTACT.address && `Address: ${CONTACT.address}`].filter(Boolean);
  return parts.length
    ? <p>{parts.join(' · ')}</p>
    : <p>For questions, contact your workspace administrator, who can reach us on your behalf.</p>;
};

export const PrivacyPolicy: React.FC = () => (
  <>
    <h1 className="text-3xl md:text-4xl font-medium mb-2">Privacy Policy</h1>
    <p className="text-sm text-[#5f6368] mb-10">Last updated {UPDATED}</p>

    <Section title="Who we are">
      <p>RealtySarv is a CRM, ERP and accounting service for real estate developers, operated by {COMPANY} (“we”, “us”). This policy explains what information the service handles and how.</p>
    </Section>
    <Section title="Information we handle">
      <p><b>Account details.</b> Name, email address, phone number, username and role for the people who use a workspace. Passwords are stored only as a one-way hash; we cannot read them.</p>
      <p><b>Business data.</b> Everything your company and its team enter: leads and customer details, site visits, bookings and documents, projects and inventory, procurement and site records, and accounting entries. Your company decides what goes in.</p>
      <p><b>Technical data.</b> A sign-in token and your display preferences are kept in your browser so you stay signed in. Our servers handle the requests the app makes and may keep basic technical logs for security and troubleshooting.</p>
    </Section>
    <Section title="How we use it">
      <p>To provide the service you signed up for, to sign people in and keep workspaces secure, to fix problems and to support you. We do not sell your data and we do not use it for advertising.</p>
    </Section>
    <Section title="How companies are kept apart">
      <p>Each company has its own workspace address and its own database. A sign-in is only valid on the company address it was issued for. Within a company, the administrator decides who can open which menus.</p>
    </Section>
    <Section title="Who else sees it">
      <p>We use infrastructure providers to host the service and its databases. If your company turns on integrations (for example lead sources, property portals, WhatsApp providers or Tally), data is shared with those services as you configure them. The app loads icons from a public content delivery network, so your browser contacts that network when a page loads.</p>
    </Section>
    <Section title="Keeping and deleting data">
      <p>We keep a workspace’s data while the workspace is active. To have a workspace or an individual’s data deleted or corrected, ask your workspace administrator or contact us.</p>
    </Section>
    <Section title="Security">
      <p>We use measures such as hashed passwords, separate databases per company and sign-ins that are bound to a company address. No online service can be perfectly secure, so please use strong passwords and tell us promptly if you suspect misuse.</p>
    </Section>
    <Section title="Changes">
      <p>We may update this policy. The date above shows when it last changed.</p>
    </Section>
    <Section title="Contact"><ContactLine /></Section>
  </>
);

export const TermsOfService: React.FC = () => (
  <>
    <h1 className="text-3xl md:text-4xl font-medium mb-2">Terms of Service</h1>
    <p className="text-sm text-[#5f6368] mb-10">Last updated {UPDATED}</p>

    <Section title="Agreement">
      <p>These terms apply when you create a RealtySarv workspace or use one. The service is provided by {COMPANY}. By using it you agree to these terms on behalf of yourself and, where you act for a company, that company.</p>
    </Section>
    <Section title="Your account and workspace">
      <p>The person who creates a workspace becomes its administrator and is responsible for the people they add, the roles they give them and keeping sign-in details safe. Give accurate information and tell us if you think an account has been misused.</p>
    </Section>
    <Section title="Your data">
      <p>You own the data your company puts into the service. You allow us to store and process it only to run the service for you. You are responsible for having the right to enter it, including customer personal data, and for using it lawfully.</p>
    </Section>
    <Section title="Acceptable use">
      <p>Do not break the law, attempt to access another company’s workspace, interfere with or overload the service, or use it to send unlawful or unsolicited messages. We may suspend access that puts the service or other customers at risk.</p>
    </Section>
    <Section title="Plans and fees">
      <p>Plans, what they include and their monthly prices are shown on the Pricing section of our website at the time you subscribe. Plan limits, such as the number of active users and the modules included, apply to your workspace. Taxes, where applicable, are in addition to the listed price unless stated otherwise.</p>
    </Section>
    <Section title="Availability and changes">
      <p>We work to keep the service available but do not promise it will be uninterrupted or error-free. We may improve, change or retire features, and will give reasonable notice of changes that significantly affect you.</p>
    </Section>
    <Section title="Reports and compliance outputs">
      <p>Documents and reports the service produces (for example booking documents, GST or TDS reports) are prepared from the data you enter. You and your advisers remain responsible for checking them and for your own legal, tax and RERA obligations.</p>
    </Section>
    <Section title="Liability">
      <p>To the extent the law allows, the service is provided “as is”, and we are not liable for indirect or consequential losses. Our total liability for any claim is limited to the fees you paid for the service in the three months before the claim arose.</p>
    </Section>
    <Section title="Ending the agreement">
      <p>You can stop using the service at any time. We may suspend or end access for serious or repeated breach of these terms. Ask us before leaving if you need an export of your data.</p>
    </Section>
    <Section title="Governing law">
      <p>These terms are governed by the laws of India.</p>
    </Section>
    <Section title="Changes and contact">
      <p>We may update these terms and will update the date above when we do. Continued use after a change means you accept it.</p>
      <ContactLine />
    </Section>
  </>
);
