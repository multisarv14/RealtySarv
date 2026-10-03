import React from 'react';
import { PLANS, PlanId } from '../plans';
import { CLIENTS, TESTIMONIALS } from '../landingContent';

interface LandingPageProps {
  onSignInClick: () => void;
  /** Opens the install wizard, optionally with a plan already chosen. */
  onStartFreeClick: (plan?: PlanId) => void;
}

type PageType = 'home' | 'docs';
type ProductId = 'lead' | 'project' | 'finance';

// Everything below describes screens that exist in the app (LeadSarv tabs, ProjectSarv menu, FinanceSarv menu, Admin).
const PRODUCTS: Record<ProductId, {
  name: string; tagline: string; color: string; tint: string; icon: string;
  items: { icon: string; title: string; desc: string }[];
}> = {
  lead: {
    name: 'LeadSarv CRM', tagline: 'From first enquiry to possession', color: '#1e8e3e', tint: '#e6f4ea', icon: 'fas fa-users-rays',
    items: [
      { icon: 'fas fa-bullseye', title: 'Leads & follow-ups', desc: 'Capture every enquiry, assign an owner and schedule follow-up tasks.' },
      { icon: 'fas fa-location-dot', title: 'Site visits', desc: 'Schedule visits and track their outcome against each lead.' },
      { icon: 'fas fa-file-signature', title: 'Bookings & documents', desc: 'Record bookings and generate RERA-ready forms, allotment letters and receipts.' },
      { icon: 'fas fa-handshake', title: 'Agreement & possession', desc: 'Follow every unit through agreement and possession stages.' },
      { icon: 'fas fa-money-check-dollar', title: 'Payment plans & ledger', desc: 'Milestone payment plans and a payment ledger for each booking.' },
      { icon: 'fas fa-people-arrows', title: 'Channel partners', desc: 'Onboard partners and see the leads and conversions they bring.' },
    ],
  },
  project: {
    name: 'ProjectSarv ERP', tagline: 'Procurement and site operations under control', color: '#1a73e8', tint: '#e8f0fe', icon: 'fas fa-hard-hat',
    items: [
      { icon: 'fas fa-th-large', title: 'Command center & analytics', desc: 'One view of projects, approvals and spend.' },
      { icon: 'fas fa-database', title: 'Master data', desc: 'Vendors, contractors, items, services and project cost heads.' },
      { icon: 'fas fa-file-invoice-dollar', title: 'Planning, BOQ & cost control', desc: 'Plan phases, set the bill of quantities and track cost against budget.' },
      { icon: 'fas fa-cart-shopping', title: 'Purchase & contracts', desc: 'Purchase requisitions, purchase orders and contractor work orders.' },
      { icon: 'fas fa-stamp', title: 'Approval center', desc: 'Approval rules by amount send each request to the right people.' },
      { icon: 'fas fa-helmet-safety', title: 'Site operations', desc: 'GRN, material issue, measurement book, daily site logs and a store ledger.' },
    ],
  },
  finance: {
    name: 'FinanceSarv', tagline: 'Project-level books and GST reports', color: '#4f46e5', tint: '#f5f3ff', icon: 'fas fa-coins',
    items: [
      { icon: 'fas fa-chart-pie', title: 'Finance dashboard', desc: 'Receivables, payables and account balances at a glance.' },
      { icon: 'fas fa-book', title: 'General ledger', desc: 'Double-entry vouchers and ledger accounts, filtered by project.' },
      { icon: 'fas fa-hand-holding-dollar', title: 'Receivables', desc: 'See what customers owe you.' },
      { icon: 'fas fa-file-invoice', title: 'Payables', desc: 'See what you owe vendors and contractors.' },
      { icon: 'fas fa-scale-balanced', title: 'Bank reconciliation', desc: 'Match bank entries against your books.' },
      { icon: 'fas fa-receipt', title: 'GST reports', desc: 'GSTR-1 sales report and input/output tax summary from your vouchers.' },
    ],
  },
};

const ROLES = [
  { icon: 'fas fa-headset', title: 'Sales team', desc: 'Work leads, log site visits, schedule follow-ups and create bookings from one screen.' },
  { icon: 'fas fa-helmet-safety', title: 'Project & site team', desc: 'Raise purchase requests, receive material, log daily site work and record measurements.' },
  { icon: 'fas fa-calculator', title: 'Accounts', desc: 'Post vouchers, track receivables and payables, and prepare GST reports.' },
  { icon: 'fas fa-user-shield', title: 'Owners & admins', desc: 'Add users, choose which menus each role can open, set up integrations and review reports.' },
];

const INTEGRATIONS = ['99acres', 'MagicBricks', 'Housing.com', 'Facebook Lead Ads', 'Google Ads', 'LinkedIn', 'WhatsApp', 'Tally'];

const FAQS = [
  ['How does my team sign in?', 'Every company gets its own address, like yourcompany.realtysarv.com. You create your team’s accounts in Admin → Users, and they sign in at that address with their own email and password.'],
  ['Is my data kept separate from other companies?', 'Yes. Each company has its own database, and a sign-in only works on the company address it was issued for.'],
  ['Do I need to install anything?', 'No. RealtySarv runs in the browser on a computer or phone.'],
  ['Can I limit what each person can see?', 'Yes. Admins assign roles and choose which menus each role can open.'],
  ['Which tools can I connect?', 'Lead sources such as Facebook Lead Ads and the property portals, WhatsApp providers, and Tally can be set up from Admin → Integrations.'],
  ['What does it cost to start?', 'Creating a workspace takes a few minutes and you aren’t charged to do it. Plans start at ₹3,999 a month; see Pricing.'],
];

const HAS_PROOF = CLIENTS.length > 0 || TESTIMONIALS.length > 0;

const NAV = [
  { id: 'product', label: 'Product' },
  { id: 'roles', label: 'Who it’s for' },
  ...(HAS_PROOF ? [{ id: 'customers', label: 'Customers' }] : []),
  { id: 'pricing', label: 'Pricing' },
  { id: 'faq', label: 'FAQ' },
];

const LandingPage: React.FC<LandingPageProps> = ({ onSignInClick, onStartFreeClick }) => {
  const [currentPage, setCurrentPage] = React.useState<PageType>('home');
  const [activeSection, setActiveSection] = React.useState('');
  const [scrolled, setScrolled] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [product, setProduct] = React.useState<ProductId>('lead');
  const scrollerRef = React.useRef<HTMLDivElement>(null);

  // The page scrolls inside its own container, not the window.
  const offsetInScroller = (el: HTMLElement) => {
    const scroller = scrollerRef.current!;
    return el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
  };

  React.useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || currentPage !== 'home') return;
    const handleScroll = () => {
      setScrolled(scroller.scrollTop > 20);
      const line = scroller.scrollTop + 120;
      let current = '';
      for (const item of NAV) {
        const el = document.getElementById(item.id);
        if (el && offsetInScroller(el) <= line) current = item.id;
      }
      setActiveSection(current);
    };
    handleScroll();
    scroller.addEventListener('scroll', handleScroll, { passive: true });
    return () => scroller.removeEventListener('scroll', handleScroll);
  }, [currentPage]);

  const scrollToSection = (id: string) => {
    setMenuOpen(false);
    const go = () => {
      const el = document.getElementById(id);
      if (el && scrollerRef.current) scrollerRef.current.scrollTo({ top: Math.max(0, offsetInScroller(el) - 72), behavior: 'smooth' });
    };
    if (currentPage !== 'home') { setCurrentPage('home'); setTimeout(go, 50); } else go();
  };

  const openDocs = () => { setMenuOpen(false); setCurrentPage('docs'); scrollerRef.current?.scrollTo({ top: 0 }); };
  const goHome = () => { setMenuOpen(false); setCurrentPage('home'); scrollerRef.current?.scrollTo({ top: 0 }); };
  const startFree = (plan?: PlanId) => { setMenuOpen(false); onStartFreeClick(plan); };

  const p = PRODUCTS[product];
  const navClass = (active: boolean) => `h-full px-1 text-[14px] font-medium transition-colors border-b-2 ${active ? 'border-[#1a73e8] text-[#1a73e8]' : 'border-transparent text-[#5f6368] hover:text-[#202124]'}`;

  return (
    <div ref={scrollerRef} className="w-full h-full bg-white font-sans text-[#202124] selection:bg-[#e8f0fe] selection:text-[#1a73e8] overflow-y-auto custom-scrollbar">
      {/* Header (the only navigation) */}
      <header className={`fixed top-0 left-0 right-0 z-[110] bg-white transition-all duration-300 ${scrolled ? 'shadow-sm h-14' : 'h-16 border-b border-[#dadce0]'}`}>
        <div className="max-w-[1240px] mx-auto px-5 sm:px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-10 h-full">
            <button onClick={goHome} className="flex items-center gap-2 min-h-11" aria-label="RealtySarv home">
              <span className="w-7 h-7 bg-[#1a73e8] rounded-sm flex items-center justify-center text-white shadow-sm"><i className="fas fa-cube text-[10px]" aria-hidden="true"></i></span>
              <span className="text-xl font-medium tracking-tight text-[#5f6368]">Realty<span className="text-[#202124] font-bold">Sarv</span></span>
            </button>
            <nav className="hidden lg:flex items-center gap-7 h-full" aria-label="Main">
              {NAV.map((n) => (
                <button key={n.id} onClick={() => scrollToSection(n.id)} className={navClass(currentPage === 'home' && activeSection === n.id)}>{n.label}</button>
              ))}
              <button onClick={openDocs} className={navClass(currentPage === 'docs')}>Docs</button>
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={onSignInClick} className="text-sm font-bold text-[#1a73e8] hover:bg-blue-50 px-3 sm:px-4 min-h-10 rounded transition-colors">Sign in</button>
            <button onClick={() => startFree()} className="hidden sm:block bg-[#1a73e8] text-white px-5 min-h-10 rounded font-bold text-sm shadow-sm hover:shadow-md hover:bg-[#174ea6] transition-all active:scale-95">Get started for free</button>
            <button onClick={() => setMenuOpen((v) => !v)} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} className="lg:hidden w-10 h-10 flex items-center justify-center rounded text-[#5f6368] hover:bg-gray-100">
              <i className={`fas ${menuOpen ? 'fa-xmark' : 'fa-bars'}`} aria-hidden="true"></i>
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav className="lg:hidden absolute top-full left-0 right-0 bg-white border-b border-[#dadce0] shadow-lg px-6 py-3 flex flex-col text-[15px] font-medium" aria-label="Mobile">
            {NAV.map((n) => <button key={n.id} onClick={() => scrollToSection(n.id)} className="text-left min-h-12 border-b border-[#f1f3f4]">{n.label}</button>)}
            <button onClick={openDocs} className="text-left min-h-12 border-b border-[#f1f3f4]">Docs</button>
            <button onClick={() => startFree()} className="mt-3 mb-1 bg-[#1a73e8] text-white min-h-12 rounded font-bold text-sm">Get started for free</button>
          </nav>
        )}
      </header>

      {currentPage === 'home' ? (
        <main className="pt-16">
          {/* Hero */}
          <section id="overview" className="bg-[#f8f9fa] py-16 md:py-24">
            <div className="max-w-[1240px] mx-auto px-5 sm:px-6 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <p className="inline-flex px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[#1a73e8] text-[11px] font-bold uppercase tracking-wider mb-6">CRM · ERP · Accounts for real estate developers</p>
                <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-medium text-[#202124] leading-[1.12] tracking-tight mb-6">Sales, site operations and accounts in one workspace</h1>
                <p className="text-lg sm:text-xl text-[#5f6368] mb-9 leading-relaxed font-light">Follow every enquiry through booking and possession, run procurement and site work, and keep your books, all in one place.</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={() => startFree()} className="min-h-12 px-8 rounded bg-[#1a73e8] text-white font-bold text-sm shadow-lg shadow-blue-500/20 hover:bg-[#174ea6] transition-all active:scale-95">Get started for free</button>
                  <button onClick={() => scrollToSection('product')} className="min-h-12 px-8 rounded border border-[#dadce0] font-bold text-sm bg-white hover:bg-gray-50 transition-all">See what’s inside</button>
                </div>
                <p className="mt-4 text-xs text-[#5f6368]">Set up in a few minutes. No payment needed to create your workspace.</p>
              </div>
              <div aria-hidden="true"><HeroMock /></div>
            </div>
          </section>

          {/* Product: one tabbed section instead of cards + three repeated detail blocks */}
          <section id="product" className="py-16 md:py-24">
            <div className="max-w-[1240px] mx-auto px-5 sm:px-6">
              <div className="max-w-2xl mb-10">
                <h2 className="text-3xl md:text-4xl font-medium mb-4">Three modules, one login</h2>
                <p className="text-lg text-[#5f6368]">Start with the CRM and add site operations and accounts when you need them.</p>
              </div>

              <div role="tablist" aria-label="Modules" className="flex flex-wrap gap-2 mb-8">
                {(Object.keys(PRODUCTS) as ProductId[]).map((id) => {
                  const active = product === id;
                  return (
                    <button key={id} role="tab" id={`tab-${id}`} aria-selected={active} aria-controls="product-panel" onClick={() => setProduct(id)}
                      className={`min-h-11 px-5 rounded-full text-sm font-bold flex items-center gap-2 border transition-colors ${active ? 'text-white border-transparent' : 'bg-white text-[#5f6368] border-[#dadce0] hover:border-[#bdc1c6]'}`}
                      style={active ? { background: PRODUCTS[id].color } : undefined}>
                      <i className={PRODUCTS[id].icon} aria-hidden="true"></i>{PRODUCTS[id].name}
                    </button>
                  );
                })}
              </div>

              <div id="product-panel" role="tabpanel" aria-labelledby={`tab-${product}`} className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-start rounded-3xl p-6 sm:p-10" style={{ background: p.tint }}>
                <div>
                  <h3 className="text-2xl font-medium mb-1">{p.name}</h3>
                  <p className="text-[#5f6368] mb-8">{p.tagline}</p>
                  <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-6">
                    {p.items.map((it) => (
                      <li key={it.title} className="flex gap-3">
                        <span className="w-9 h-9 shrink-0 rounded-lg bg-white shadow-sm flex items-center justify-center" style={{ color: p.color }}><i className={it.icon} aria-hidden="true"></i></span>
                        <div><h4 className="font-bold text-sm leading-snug">{it.title}</h4><p className="text-sm text-[#5f6368] mt-0.5 leading-relaxed">{it.desc}</p></div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div aria-hidden="true" className="lg:sticky lg:top-24">
                  {product === 'lead' && <PipelineMock />}
                  {product === 'project' && <ProcurementMock />}
                  {product === 'finance' && <FinanceMock />}
                </div>
              </div>
            </div>
          </section>

          {/* Roles */}
          <section id="roles" className="py-16 md:py-24 bg-[#f8f9fa]">
            <div className="max-w-[1240px] mx-auto px-5 sm:px-6">
              <div className="max-w-2xl mb-10">
                <h2 className="text-3xl md:text-4xl font-medium mb-4">Everyone gets their own view</h2>
                <p className="text-lg text-[#5f6368]">Roles decide which menus each person can open, so the sales team, site team and accounts only see their own tools.</p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {ROLES.map((r) => (
                  <div key={r.title} className="bg-white rounded-2xl border border-[#dadce0] p-6">
                    <span className="w-11 h-11 rounded-xl bg-[#e8f0fe] text-[#1a73e8] flex items-center justify-center mb-4"><i className={r.icon} aria-hidden="true"></i></span>
                    <h3 className="font-bold mb-1.5">{r.title}</h3>
                    <p className="text-sm text-[#5f6368] leading-relaxed">{r.desc}</p>
                  </div>
                ))}
              </div>

              <div className="mt-12 bg-white rounded-2xl border border-[#dadce0] p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center gap-6 justify-between">
                <div className="max-w-xl">
                  <h3 className="text-xl font-medium mb-1.5">Connect the tools you already use</h3>
                  <p className="text-sm text-[#5f6368]">Set these up from Admin → Integrations.</p>
                </div>
                <ul className="flex flex-wrap gap-2">
                  {INTEGRATIONS.map((n) => <li key={n} className="px-3.5 py-1.5 rounded-full bg-[#f1f3f4] text-sm font-medium text-[#3c4043]">{n}</li>)}
                </ul>
              </div>
            </div>
          </section>

          {/* Customers: only rendered once real names/quotes are added in landingContent.ts */}
          {HAS_PROOF && (
            <section id="customers" className="py-16 md:py-24">
              <div className="max-w-[1240px] mx-auto px-5 sm:px-6">
                {CLIENTS.length > 0 && (
                  <div className="text-center mb-12">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-[#5f6368] mb-6">Trusted by developers</h2>
                    <ul className="flex flex-wrap justify-center gap-x-10 gap-y-4 text-lg font-bold text-[#3c4043]">
                      {CLIENTS.map((c) => <li key={c}>{c}</li>)}
                    </ul>
                  </div>
                )}
                {TESTIMONIALS.length > 0 && (
                  <>
                    <h2 className="text-3xl md:text-4xl font-medium mb-10 text-center">What customers say</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {TESTIMONIALS.map((t) => (
                        <figure key={t.name + t.company} className="bg-[#f8f9fa] rounded-2xl border border-[#dadce0] p-6 flex flex-col">
                          <blockquote className="text-[15px] leading-relaxed text-[#202124] flex-1">“{t.quote}”</blockquote>
                          <figcaption className="mt-5 text-sm"><span className="font-bold">{t.name}</span><br /><span className="text-[#5f6368]">{t.role}, {t.company}</span></figcaption>
                        </figure>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </section>
          )}

          {/* Pricing */}
          <section id="pricing" className="py-16 md:py-24">
            <div className="max-w-[1240px] mx-auto px-5 sm:px-6 text-center">
              <h2 className="text-3xl md:text-4xl font-medium mb-4">Simple pricing</h2>
              <p className="text-lg text-[#5f6368] mb-14 max-w-xl mx-auto">Pick a plan when you set up your workspace.</p>
              <div className="grid md:grid-cols-2 max-w-4xl mx-auto gap-8 text-left">
                {PLANS.map((plan, i) => {
                  const dark = i === 1;
                  return (
                    <div key={plan.id} className={`p-8 sm:p-10 rounded-3xl flex flex-col relative ${dark ? 'bg-[#202124] text-white shadow-2xl' : 'border border-[#dadce0]'}`}>
                      {dark && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#1a73e8] px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">All three modules</div>}
                      <h3 className="text-2xl font-bold mb-2">{plan.id}</h3>
                      <p className={`text-sm mb-7 ${dark ? 'text-gray-400' : 'text-[#5f6368]'}`}>{plan.tagline}</p>
                      <div className="mb-8"><span className="text-5xl font-medium">{plan.price}</span><span className={`font-medium ${dark ? 'text-gray-400' : 'text-gray-500'}`}>/month</span></div>
                      <ul className="space-y-3.5 mb-9 flex-1">
                        {plan.features.map((f) => (
                          <li key={f} className={`flex items-start gap-3 text-sm ${dark ? 'text-gray-300' : 'text-[#5f6368]'}`}><i className={`fas fa-check mt-1 ${dark ? 'text-[#34a853]' : 'text-blue-500'}`} aria-hidden="true"></i> {f}</li>
                        ))}
                      </ul>
                      <button onClick={() => startFree(plan.id)} className={`w-full min-h-12 rounded-lg font-bold transition-all ${dark ? 'bg-[#1a73e8] hover:bg-[#174ea6]' : 'border-2 border-[#1a73e8] text-[#1a73e8] hover:bg-blue-50'}`}>Choose {plan.id}</button>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="py-16 md:py-24 bg-[#f8f9fa]">
            <div className="max-w-3xl mx-auto px-5 sm:px-6">
              <h2 className="text-3xl md:text-4xl font-medium mb-10 text-center">Questions, answered</h2>
              <div className="space-y-3">
                {FAQS.map(([q, a]) => (
                  <details key={q} className="group bg-white rounded-2xl border border-[#dadce0] open:shadow-sm">
                    <summary className="flex items-center justify-between gap-4 cursor-pointer list-none min-h-14 px-5 py-3 font-bold text-[15px]">
                      {q}<i className="fas fa-chevron-down text-xs text-[#5f6368] transition-transform group-open:rotate-180" aria-hidden="true"></i>
                    </summary>
                    <p className="px-5 pb-5 text-sm text-[#5f6368] leading-relaxed">{a}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>

          {/* Closing CTA (the only repeated call to action) */}
          <section className="py-16 md:py-20 bg-[#1a73e8] text-white text-center">
            <div className="max-w-2xl mx-auto px-5 sm:px-6">
              <h2 className="text-3xl md:text-4xl font-medium mb-4">Set up your workspace today</h2>
              <p className="text-blue-100 mb-8">Create your company, choose your address and add your team in a few minutes.</p>
              <button onClick={() => startFree()} className="min-h-12 px-8 rounded bg-white text-[#1a73e8] font-bold text-sm hover:bg-blue-50 transition-colors">Get started for free</button>
              <p className="mt-4 text-sm text-blue-100">Already have a workspace? <button onClick={onSignInClick} className="font-bold underline min-h-11 px-1">Sign in</button></p>
            </div>
          </section>

          <footer className="bg-[#202124] text-gray-400 py-10">
            <div className="max-w-[1240px] mx-auto px-5 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-6 text-sm">
              <div>
                <span className="flex items-center gap-2 text-white text-lg font-bold mb-1"><span className="w-7 h-7 bg-[#1a73e8] rounded-sm flex items-center justify-center"><i className="fas fa-cube text-[10px]" aria-hidden="true"></i></span>RealtySarv</span>
                <p>© {new Date().getFullYear()} MultiSarv Pvt.Ltd. All rights reserved.</p>
              </div>
              <nav className="flex flex-wrap gap-x-6 gap-y-1" aria-label="Footer">
                {NAV.map((n) => <button key={n.id} onClick={() => scrollToSection(n.id)} className="min-h-11 hover:text-white">{n.label}</button>)}
                <button onClick={openDocs} className="min-h-11 hover:text-white">Docs</button>
                <button onClick={onSignInClick} className="min-h-11 hover:text-white">Sign in</button>
              </nav>
            </div>
          </footer>
        </main>
      ) : (
        <main className="pt-28 px-5 sm:px-6 pb-20 text-center min-h-screen bg-white flex flex-col items-center">
          <div className="w-20 h-20 bg-blue-50 text-[#1a73e8] rounded-3xl flex items-center justify-center text-4xl mb-8 shadow-inner"><i className="fas fa-book-open" aria-hidden="true"></i></div>
          <h1 className="text-4xl md:text-5xl font-medium mb-4">Documentation & support</h1>
          <p className="text-xl text-[#5f6368] max-w-2xl mx-auto mb-12">Get your first workspace running in a few minutes.</p>
          <ol className="w-full max-w-2xl text-left space-y-4">
            {[
              ['Create your workspace', 'Choose “Get started for free”, enter your company and owner details, and pick a plan.'],
              ['Sign in as the owner', 'You’re signed in automatically the first time. The setup wizard walks you through your company profile, projects, team and lead sources.'],
              ['Invite your team', 'In Admin Settings → Users, add teammates and assign roles and projects. They sign in at your company address with their own email.'],
              ['Start working', 'Capture leads in LeadSarv CRM, run site operations in ProjectSarv, and keep books in FinanceSarv.'],
            ].map(([title, body], i) => (
              <li key={title} className="flex gap-4 p-5 rounded-2xl border border-[#dadce0] bg-white">
                <span className="shrink-0 w-8 h-8 rounded-full bg-[#e8f0fe] text-[#1a73e8] font-bold flex items-center justify-center">{i + 1}</span>
                <div><h2 className="font-bold text-[#202124]">{title}</h2><p className="text-sm text-[#5f6368] mt-1 leading-relaxed">{body}</p></div>
              </li>
            ))}
          </ol>
          <button onClick={goHome} className="mt-12 min-h-11 text-[#1a73e8] font-bold flex items-center gap-2 hover:underline"><i className="fas fa-arrow-left text-xs" aria-hidden="true"></i> Back to overview</button>
        </main>
      )}
    </div>
  );
};

// ---- Product mockups (sample data) ----
const Window: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-xl border border-[#dadce0]">
    <div className="flex items-center justify-between mb-4">
      <span className="text-sm font-bold text-[#202124]">{title}</span>
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#5f6368]">Sample data</span>
    </div>
    {children}
  </div>
);

const HeroMock: React.FC = () => (
  <Window title="Sales overview">
    <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mb-3">
      {[['Active leads', '248', '#1a73e8'], ['Site visits', '36', '#1e8e3e'], ['Bookings', '12', '#4f46e5']].map(([label, value, color]) => (
        <div key={label} className="bg-[#f8f9fa] rounded-lg p-3">
          <p className="text-[10px] text-[#5f6368] font-medium">{label}</p>
          <p className="text-xl sm:text-2xl font-bold mt-0.5" style={{ color }}>{value}</p>
        </div>
      ))}
    </div>
    <div className="bg-[#f8f9fa] rounded-lg p-3 mb-3">
      <p className="text-[10px] text-[#5f6368] font-medium mb-2">Leads this week</p>
      <div className="flex items-end gap-2 h-16">
        {[40, 62, 48, 80, 66, 92, 74].map((h, i) => <div key={i} className="flex-1 rounded-t bg-[#1a73e8]/80" style={{ height: `${h}%` }}></div>)}
      </div>
    </div>
    <div className="divide-y divide-[#f1f3f4] border border-[#f1f3f4] rounded-lg">
      {[['Aarav Mehta', 'Site visit', 'bg-[#e6f4ea] text-[#1e8e3e]'], ['Neha Kulkarni', 'Qualified', 'bg-[#e8f0fe] text-[#1a73e8]'], ['Rohan Desai', 'Token paid', 'bg-[#fef7e0] text-[#b06000]']].map(([n, st, cls]) => (
        <div key={n} className="flex items-center justify-between px-3 py-2"><span className="text-xs font-medium">{n}</span><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cls}`}>{st}</span></div>
      ))}
    </div>
  </Window>
);

const PipelineMock: React.FC = () => (
  <Window title="Lead pipeline">
    <div className="grid grid-cols-3 gap-3">
      {([
        ['Qualified', '#1a73e8', [['Neha Kulkarni', '2BHK · Pune'], ['Vikram Shah', '3BHK · Baner']]],
        ['Site visit', '#1e8e3e', [['Aarav Mehta', 'Sat 11:00'], ['Isha Patil', 'Sun 16:30']]],
        ['Token paid', '#b06000', [['Rohan Desai', '₹1.00L']]],
      ] as [string, string, string[][]][]).map(([title, color, cards]) => (
        <div key={title} className="bg-[#f8f9fa] rounded-xl p-2.5">
          <div className="flex items-center gap-1.5 mb-2"><span className="w-2 h-2 rounded-full" style={{ background: color }}></span><span className="text-[11px] font-bold">{title}</span></div>
          <div className="space-y-2">
            {cards.map(([n, d]) => (
              <div key={n} className="bg-white rounded-lg border border-black/5 shadow-sm p-2.5"><p className="text-xs font-bold truncate">{n}</p><p className="text-[10px] text-[#5f6368] mt-0.5">{d}</p></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </Window>
);

const ProcurementMock: React.FC = () => (
  <Window title="Purchase approvals">
    <div className="divide-y divide-[#f1f3f4] border border-[#f1f3f4] rounded-xl">
      {[
        ['PR-0042', 'Cement OPC 53 · 400 bags', '₹1.52L', 'Project Mgr', 'bg-[#fef7e0] text-[#b06000]'],
        ['PO-0017', 'TMT steel 12mm · 8 MT', '₹4.96L', 'Accounts', 'bg-[#e8f0fe] text-[#1a73e8]'],
        ['PO-0016', 'Excavation · hard rock', '₹6.40L', 'Approved', 'bg-[#e6f4ea] text-[#1e8e3e]'],
      ].map(([id, what, amt, st, cls]) => (
        <div key={id} className="flex items-center justify-between gap-3 px-3 py-3">
          <div className="min-w-0"><p className="text-xs font-bold">{id}</p><p className="text-[11px] text-[#5f6368] truncate">{what}</p></div>
          <div className="flex items-center gap-3 shrink-0"><span className="text-xs font-bold">{amt}</span><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cls}`}>{st}</span></div>
        </div>
      ))}
    </div>
    <div className="mt-4 p-3 bg-[#f8f9fa] rounded-xl">
      <p className="text-[11px] font-bold mb-2">Stock vs minimum level</p>
      {([['Cement', 70], ['Steel', 32]] as [string, number][]).map(([n, v]) => (
        <div key={n} className="flex items-center gap-2 mb-1.5 last:mb-0"><span className="w-12 text-[10px] text-[#5f6368]">{n}</span><div className="flex-1 h-2 bg-[#dadce0] rounded-full overflow-hidden"><div className={`h-full ${v < 40 ? 'bg-[#d93025]' : 'bg-[#1a73e8]'}`} style={{ width: `${v}%` }}></div></div></div>
      ))}
    </div>
  </Window>
);

const FinanceMock: React.FC = () => (
  <Window title="Finance overview">
    <div className="grid grid-cols-2 gap-3 mb-3">
      <div className="p-3 bg-[#e6f4ea] rounded-xl"><p className="text-[10px] font-bold text-[#1e8e3e] uppercase">Receivables</p><p className="text-xl font-bold text-[#0d652d]">₹18.4L</p></div>
      <div className="p-3 bg-[#fef7e0] rounded-xl"><p className="text-[10px] font-bold text-[#b06000] uppercase">Payables</p><p className="text-xl font-bold text-[#7a4100]">₹9.7L</p></div>
    </div>
    <div className="border border-[#f1f3f4] rounded-xl overflow-hidden">
      <div className="bg-[#4f46e5] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-2">GSTR-1 sales report</div>
      {[['Customer A · 27AAAA…', '₹12.00L', '₹2.16L'], ['Customer B · 27BBBB…', '₹8.50L', '₹1.53L']].map(([c, t, g]) => (
        <div key={c} className="flex items-center justify-between px-3 py-2 text-xs border-t border-[#f1f3f4] first:border-t-0"><span className="truncate pr-3">{c}</span><span className="shrink-0 text-[#5f6368]">{t} · <b className="text-[#202124]">{g}</b></span></div>
      ))}
    </div>
  </Window>
);

export default LandingPage;
