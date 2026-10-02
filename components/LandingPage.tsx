import React from 'react';
import { PLANS, PlanId } from '../plans';

interface LandingPageProps {
  onSignInClick: () => void;
  /** Opens the install wizard, optionally with a plan already chosen. */
  onStartFreeClick: (plan?: PlanId) => void;
}

type PageType = 'home' | 'docs' | 'support';

const LandingPage: React.FC<LandingPageProps> = ({ onSignInClick, onStartFreeClick }) => {
  const [currentPage, setCurrentPage] = React.useState<PageType>('home');
  const [activeSection, setActiveSection] = React.useState('Overview');
  const [scrolled, setScrolled] = React.useState(false);

  // Sub-navigation items for the sticky bar
  const subNavItems = [
    { label: 'Overview', id: 'overview' },
    { label: 'Capabilities', id: 'solutions' },
    { label: 'LeadSarv CRM', id: 'crm-detail' },
    { label: 'ProjectSarv ERP', id: 'products' },
    { label: 'FinanceSarv', id: 'finance-detail' },
    { label: 'Pricing', id: 'pricing' },
  ];

  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);

  // Offset of an element from the top of the scroll container's content.
  const offsetInScroller = (el: HTMLElement) => {
    const scroller = scrollerRef.current!;
    return el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
  };

  React.useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || currentPage !== 'home') return;
    const handleScroll = () => {
      setScrolled(scroller.scrollTop > 20);
      // Scroll-spy: the last section whose top has passed the sticky bars is the active one.
      const line = scroller.scrollTop + 130;
      let current = subNavItems[0].label;
      for (const item of subNavItems) {
        const el = document.getElementById(item.id);
        if (el && offsetInScroller(el) <= line) current = item.label;
      }
      setActiveSection(current);
    };
    handleScroll();
    scroller.addEventListener('scroll', handleScroll, { passive: true });
    return () => scroller.removeEventListener('scroll', handleScroll);
  }, [currentPage]);

  const scrollToSection = (id: string, label: string) => {
    setMenuOpen(false);
    const go = () => {
      const el = document.getElementById(id);
      if (!el || !scrollerRef.current) return;
      scrollerRef.current.scrollTo({ top: Math.max(0, offsetInScroller(el) - 112), behavior: 'smooth' });
      setActiveSection(label);
    };
    if (currentPage !== 'home') { setCurrentPage('home'); setTimeout(go, 50); } else go();
  };

  const openDocs = () => { setMenuOpen(false); setCurrentPage('docs'); scrollerRef.current?.scrollTo({ top: 0 }); };

  return (
    <div ref={scrollerRef} className="w-full h-full bg-white font-sans text-[#202124] selection:bg-[#e8f0fe] selection:text-[#1a73e8] overflow-y-auto custom-scrollbar">
      {/* Global Header */}
      <header className={`fixed top-0 left-0 right-0 z-[110] transition-all duration-300 ${scrolled ? 'bg-white shadow-sm h-14' : 'bg-white h-16 border-b border-[#dadce0]'}`}>
        <div className="max-w-[1440px] mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-8 h-full">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentPage('home')}>
              <div className="w-7 h-7 bg-[#1a73e8] rounded-sm flex items-center justify-center text-white shadow-sm">
                <i className="fas fa-cube text-[10px]"></i>
              </div>
              <span className="text-xl font-medium tracking-tight text-[#5f6368]">
                Realty<span className="text-[#202124] font-bold">Sarv</span>
              </span>
            </div>
            
            <nav className="hidden lg:flex items-center gap-6 h-full text-[14px] font-medium text-[#5f6368]">
              <button onClick={() => scrollToSection('crm-detail', 'LeadSarv CRM')} className="hover:text-[#1a73e8] transition-colors">CRM</button>
              <button onClick={() => scrollToSection('finance-detail', 'FinanceSarv')} className="hover:text-[#1a73e8] transition-colors">Accounting</button>
              <button onClick={() => scrollToSection('pricing', 'Pricing')} className="hover:text-[#1a73e8] transition-colors">Pricing</button>
              <button onClick={openDocs} className={`transition-colors ${currentPage === 'docs' ? 'text-[#1a73e8]' : 'hover:text-[#1a73e8]'}`}>Docs</button>
            </nav>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={onSignInClick} className="text-sm font-bold text-[#1a73e8] hover:bg-blue-50 px-3 sm:px-4 min-h-10 rounded transition-colors">Sign in</button>
            <button onClick={() => onStartFreeClick()} className="hidden sm:block bg-[#1a73e8] text-white px-5 min-h-10 rounded font-bold text-sm shadow-sm hover:shadow-md hover:bg-[#174ea6] transition-all active:scale-95">Get started for free</button>
            <button onClick={() => setMenuOpen((v) => !v)} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} className="lg:hidden w-10 h-10 flex items-center justify-center rounded text-[#5f6368] hover:bg-gray-100">
              <i className={`fas ${menuOpen ? 'fa-xmark' : 'fa-bars'}`} aria-hidden="true"></i>
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav className="lg:hidden absolute top-full left-0 right-0 bg-white border-b border-[#dadce0] shadow-lg px-6 py-3 flex flex-col text-[15px] font-medium text-[#202124]">
            <button onClick={() => scrollToSection('crm-detail', 'LeadSarv CRM')} className="text-left min-h-12 border-b border-[#f1f3f4]">CRM</button>
            <button onClick={() => scrollToSection('finance-detail', 'FinanceSarv')} className="text-left min-h-12 border-b border-[#f1f3f4]">Accounting</button>
            <button onClick={() => scrollToSection('pricing', 'Pricing')} className="text-left min-h-12 border-b border-[#f1f3f4]">Pricing</button>
            <button onClick={openDocs} className="text-left min-h-12 border-b border-[#f1f3f4]">Docs</button>
            <button onClick={() => { setMenuOpen(false); onStartFreeClick(); }} className="mt-3 mb-1 bg-[#1a73e8] text-white min-h-12 rounded font-bold text-sm">Get started for free</button>
          </nav>
        )}
      </header>

      {/* Sub-Navigation Bar */}
      {currentPage === 'home' && (
        <div className={`fixed left-0 right-0 z-[100] bg-white border-b border-[#dadce0] transition-all duration-300 ${scrolled ? 'top-14' : 'top-16'}`}>
            <div className="max-w-[1440px] mx-auto px-6 h-12 flex items-center justify-between">
                <nav className="flex items-center h-full overflow-x-auto no-scrollbar gap-2">
                    {subNavItems.map((item) => (
                        <button 
                            key={item.id} 
                            onClick={() => scrollToSection(item.id, item.label)}
                            className={`h-full px-4 text-[11px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border-b-2 ${activeSection === item.label ? 'border-[#1a73e8] text-[#1a73e8]' : 'border-transparent text-[#5f6368] hover:text-[#202124]'}`}
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>
            </div>
        </div>
      )}

      {currentPage === 'home' ? (
        <main className="pt-[112px]">
          {/* Hero Section */}
          <section id="overview" className="relative py-24 md:py-32 overflow-hidden bg-[#f8f9fa] scroll-mt-[112px]">
            <div className="max-w-[1440px] mx-auto px-6 relative z-10">
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div className="max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[#1a73e8] text-[10px] font-bold uppercase tracking-wider mb-6">
                        <i className="fas fa-sparkles"></i> THE UNIFIED OPERATING SYSTEM
                    </div>
                    <h1 className="text-5xl md:text-[64px] font-medium text-[#202124] leading-[1.1] tracking-tight mb-8">
                        The real estate <br className="hidden md:block" /> cockpit for leaders
                    </h1>
                    <p className="text-xl text-[#5f6368] mb-10 leading-relaxed font-light">
                        From the first lead click to the final balance sheet. RealtySarv integrates CRM, ERP, and Finance into one compliant ecosystem.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <button onClick={() => onStartFreeClick()} className="w-full sm:w-auto bg-[#1a73e8] text-white px-8 py-3.5 rounded font-bold text-sm shadow-lg shadow-blue-500/20 hover:bg-[#174ea6] transition-all transform active:scale-95">Start for free</button>
                        <button onClick={() => scrollToSection('solutions', 'Capabilities')} className="w-full sm:w-auto px-8 py-3.5 rounded border border-[#dadce0] font-bold text-sm bg-white hover:bg-gray-50 transition-all">Explore Platform</button>
                    </div>
                </div>
                
                <div className="relative" aria-hidden="true">
                    <div className="bg-white rounded-2xl border border-[#dadce0] p-3 sm:p-4 shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
                        <div className="bg-[#f8f9fa] rounded-xl p-4 sm:p-5 overflow-hidden">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-[#ea4335]"></span>
                                    <span className="w-2.5 h-2.5 rounded-full bg-[#fbbc04]"></span>
                                    <span className="w-2.5 h-2.5 rounded-full bg-[#34a853]"></span>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[#5f6368]">Sales overview · sample data</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mb-3">
                                {[['Active leads', '248', '#1a73e8'], ['Site visits', '36', '#1e8e3e'], ['Bookings', '12', '#4f46e5']].map(([label, value, color]) => (
                                    <div key={label} className="bg-white rounded-lg border border-black/5 shadow-sm p-3">
                                        <p className="text-[10px] text-[#5f6368] font-medium">{label}</p>
                                        <p className="text-xl sm:text-2xl font-bold mt-0.5" style={{ color }}>{value}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-white rounded-lg border border-black/5 shadow-sm p-3 mb-3">
                                <p className="text-[10px] text-[#5f6368] font-medium mb-2">Leads this week</p>
                                <div className="flex items-end gap-2 h-16">
                                    {[40, 62, 48, 80, 66, 92, 74].map((h, i) => (
                                        <div key={i} className="flex-1 rounded-t bg-[#1a73e8]/80" style={{ height: `${h}%` }}></div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white rounded-lg border border-black/5 shadow-sm divide-y divide-[#f1f3f4]">
                                {[['Aarav Mehta', 'Site visit', 'bg-[#e6f4ea] text-[#1e8e3e]'], ['Neha Kulkarni', 'Qualified', 'bg-[#e8f0fe] text-[#1a73e8]'], ['Rohan Desai', 'Token paid', 'bg-[#fef7e0] text-[#b06000]']].map(([n, st, cls]) => (
                                    <div key={n} className="flex items-center justify-between px-3 py-2">
                                        <span className="text-xs font-medium text-[#202124]">{n}</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cls}`}>{st}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
              </div>
            </div>
          </section>

          {/* Capabilities Grid */}
          <section id="solutions" className="py-24 bg-white scroll-mt-[112px]">
            <div className="max-w-[1440px] mx-auto px-6">
              <div className="max-w-3xl mb-16">
                <h2 className="text-4xl md:text-5xl font-medium text-[#202124] mb-6">Built to eliminate silos</h2>
                <p className="text-lg text-[#5f6368] leading-relaxed">Three distinct systems working in perfect harmony to drive your development's growth.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                  <FeatureCard 
                    title="LeadSarv CRM" 
                    desc="Lead capture, follow-up tasks, site visits, and RERA-ready booking documents for sales teams."
                    icon="fas fa-users-rays"
                    color="#1e8e3e"
                    bgColor="bg-[#e6f4ea]"
                    onClick={() => scrollToSection('crm-detail', 'LeadSarv CRM')}
                  />
                  <FeatureCard 
                    title="ProjectSarv ERP" 
                    desc="Master site logistics, material procurement, contractor work orders, and site DPRs."
                    icon="fas fa-hard-hat"
                    color="#1a73e8"
                    bgColor="bg-[#e8f0fe]"
                    onClick={() => scrollToSection('products', 'ProjectSarv ERP')}
                  />
                  <FeatureCard 
                    title="FinanceSarv" 
                    desc="General ledger, GST and TDS reports, and Tally integration for your accounts team."
                    icon="fas fa-coins"
                    color="#4f46e5"
                    bgColor="bg-[#f5f3ff]"
                    onClick={() => scrollToSection('finance-detail', 'FinanceSarv')}
                  />
              </div>
            </div>
          </section>

          {/* NEW: LeadSarv CRM Detailed Section */}
          <section id="crm-detail" className="py-24 bg-[#e6f4ea]/30 scroll-mt-[112px] border-y border-[#e6f4ea]">
             <div className="max-w-[1440px] mx-auto px-6">
                <div className="grid lg:grid-cols-2 gap-20 items-center">
                    <div className="order-2 lg:order-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-[#1e8e3e] text-[10px] font-bold uppercase tracking-wider mb-6">
                            SALES VELOCITY ENGINE
                        </div>
                        <h2 className="text-4xl font-medium text-[#202124] mb-8">LeadSarv CRM: <br /> From Prospect to Possession</h2>
                        <div className="space-y-8">
                            <FeatureListItem icon="fas fa-magnet" title="Every lead in one place" desc="Bring leads from Facebook Lead Ads, property portals (99acres, MagicBricks, Housing.com) and your website into one inbox. Set up each source in Admin → Integrations." />
                            <FeatureListItem icon="fas fa-route" title="Lifecycle Tracking" desc="Move leads through your own pipeline stages, from Qualified and Site Visit to Token Paid and Confirmed Booking, with follow-up tasks for your team." />
                            <FeatureListItem icon="fas fa-file-invoice" title="Booking documents" desc="Generate RERA-ready booking forms, allotment letters and payment receipts from the booking record." />
                        </div>
                        <button onClick={() => onStartFreeClick()} className="mt-12 bg-[#1e8e3e] text-white px-8 py-3 rounded font-bold text-sm shadow-lg hover:bg-[#1b7a35] transition-all">Start free</button>
                    </div>
                    <div className="order-1 lg:order-2" aria-hidden="true"><PipelineMock /></div>
                </div>
             </div>
          </section>

          {/* ProjectSarv Detailed Features Section */}
          <section id="products" className="py-24 bg-[#f8f9fa] scroll-mt-[112px]">
            <div className="max-w-[1440px] mx-auto px-6">
                <div className="grid lg:grid-cols-2 gap-20 items-center">
                    <div>
                        <div aria-hidden="true"><ProcurementMock /></div>
                    </div>
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-[#1a73e8] text-[10px] font-bold uppercase tracking-wider mb-6">
                            SITE OPERATIONS CONTROL
                        </div>
                        <h2 className="text-4xl font-medium text-[#202124] mb-8">ProjectSarv ERP: <br /> Precision Logistics</h2>
                        <div className="space-y-8">
                            <FeatureListItem icon="fas fa-chart-pie" title="BOQ-Based Planning" desc="Define granular bill of quantities for materials and services before work begins." />
                            <FeatureListItem icon="fas fa-receipt" title="Automated PR/PO Workflow" desc="Run site indents and purchase orders through approval rules based on amount." />
                            <FeatureListItem icon="fas fa-boxes-stacked" title="Store Inventory Tracking" desc="Track material stock against minimum levels, with goods receipts recorded against purchase orders." />
                        </div>
                    </div>
                </div>
            </div>
          </section>

          {/* NEW: FinanceSarv Detailed Section */}
          <section id="finance-detail" className="py-24 bg-[#f5f3ff] scroll-mt-[112px] border-y border-indigo-100">
             <div className="max-w-[1440px] mx-auto px-6">
                <div className="grid lg:grid-cols-2 gap-20 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-[#4f46e5] text-[10px] font-bold uppercase tracking-wider mb-6">
                            STATUTORY COMPLIANCE HUB
                        </div>
                        <h2 className="text-4xl font-medium text-[#202124] mb-8">FinanceSarv: <br /> Institutional-Grade Accounting</h2>
                        <div className="space-y-8">
                            <FeatureListItem icon="fas fa-book" title="General Ledger" desc="Double-entry accounting built for complex project-level financials and inter-company transactions." />
                            <FeatureListItem icon="fas fa-shield-halved" title="GST & TDS reports" desc="GSTR-1 sales report and TDS tracking, prepared from your vouchers and ready for your filing." />
                            <FeatureListItem icon="fas fa-sync" title="Tally integration" desc="Set up the Tally connection in Admin → Accounting to share ledger data with your auditors." />
                        </div>
                        <button onClick={() => scrollToSection('pricing', 'Pricing')} className="mt-12 border-2 border-[#4f46e5] text-[#4f46e5] px-8 py-3 rounded font-bold text-sm hover:bg-indigo-50 transition-all">See pricing</button>
                    </div>
                    <div className="bg-white p-8 rounded-3xl shadow-xl border border-indigo-100">
                        <div className="space-y-6">
                             <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                                 <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">GSTR-1 REPORT · SAMPLE DATA</span>
                                 <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">READY</span>
                             </div>
                             <div className="grid grid-cols-2 gap-6">
                                 <div className="p-4 bg-indigo-50 rounded-xl">
                                     <p className="text-[10px] font-bold text-indigo-400 uppercase">Input Tax Credit</p>
                                     <p className="text-xl font-bold text-indigo-900">₹4.25L</p>
                                 </div>
                                 <div className="p-4 bg-orange-50 rounded-xl">
                                     <p className="text-[10px] font-bold text-orange-400 uppercase">TDS Payable</p>
                                     <p className="text-xl font-bold text-orange-900">₹1.12L</p>
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>
             </div>
          </section>

          {/* Pricing Section */}
          <section id="pricing" className="py-24 bg-white scroll-mt-[112px]">
            <div className="max-w-[1440px] mx-auto px-6 text-center">
              <h2 className="text-4xl md:text-5xl font-medium text-[#202124] mb-6">Transparent pricing</h2>
              <p className="text-lg text-[#5f6368] mb-16 max-w-2xl mx-auto">Scalable plans for growing developers. All statutory updates included.</p>
              
              <div className="grid md:grid-cols-2 max-w-4xl mx-auto gap-8 text-left">
                  {PLANS.map((plan, i) => {
                    const dark = i === 1;
                    return (
                      <div key={plan.id} className={`p-8 sm:p-10 rounded-3xl flex flex-col relative ${dark ? 'bg-[#202124] text-white shadow-2xl' : 'border border-[#dadce0] hover:shadow-xl transition-all'}`}>
                        {dark && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#1a73e8] px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Full platform</div>}
                        <h3 className="text-2xl font-bold mb-2">{plan.id}</h3>
                        <p className={`text-sm mb-8 ${dark ? 'text-gray-400' : 'text-[#5f6368]'}`}>{plan.tagline}</p>
                        <div className="mb-10">
                          <span className="text-5xl font-medium">{plan.price}</span>
                          <span className={`font-medium ${dark ? 'text-gray-400' : 'text-gray-500'}`}>/month</span>
                        </div>
                        <ul className="space-y-4 mb-10 flex-1">
                          {plan.features.map((f) => (
                            <li key={f} className={`flex items-start gap-3 text-sm ${dark ? 'text-gray-300' : 'text-[#5f6368]'}`}><i className={`fas fa-check mt-1 ${dark ? 'text-[#34a853]' : 'text-blue-500'}`} aria-hidden="true"></i> {f}</li>
                          ))}
                        </ul>
                        <button onClick={() => onStartFreeClick(plan.id)} className={`w-full min-h-12 rounded-lg font-bold transition-all ${dark ? 'bg-[#1a73e8] hover:bg-[#174ea6]' : 'border-2 border-[#1a73e8] text-[#1a73e8] hover:bg-blue-50'}`}>Choose {plan.id}</button>
                      </div>
                    );
                  })}
              </div>
            </div>
          </section>

          {/* Global Footer */}
          <footer className="bg-[#202124] text-white pt-20 pb-10">
            <div className="max-w-[1440px] mx-auto px-6">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-12 mb-16">
                <div className="col-span-2">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 bg-[#1a73e8] rounded-sm flex items-center justify-center text-white shadow-sm"><i className="fas fa-cube text-[10px]"></i></div>
                        <span className="text-2xl font-bold tracking-tight text-white">RealtySarv</span>
                    </div>
                    <p className="text-sm text-gray-400 max-w-xs leading-relaxed">The unified operational system for Indian real estate developers. Designed for RERA and scale.</p>
                </div>
                <div>
                    <h5 className="font-bold text-white text-xs uppercase tracking-widest mb-6">Systems</h5>
                    <ul className="space-y-4 text-sm text-gray-400">
                        <li onClick={() => scrollToSection('crm-detail', 'LeadSarv CRM')} className="hover:text-white cursor-pointer">LeadSarv CRM</li>
                        <li onClick={() => scrollToSection('products', 'ProjectSarv ERP')} className="hover:text-white cursor-pointer">ProjectSarv ERP</li>
                        <li onClick={() => scrollToSection('finance-detail', 'FinanceSarv')} className="hover:text-white cursor-pointer">FinanceSarv</li>
                    </ul>
                </div>
              </div>
              <div className="pt-10 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-gray-500">
                <p>© {new Date().getFullYear()} MultiSarv Pvt.Ltd. All rights reserved.</p>
              </div>
            </div>
          </footer>
        </main>
      ) : (
        <div className="pt-32 px-6 pb-20 text-center animate-fadeIn min-h-screen bg-white flex flex-col items-center">
            <div className="w-20 h-20 bg-blue-50 text-[#1a73e8] rounded-3xl flex items-center justify-center text-4xl mb-8 shadow-inner">
                <i className="fas fa-book-open"></i>
            </div>
            <h1 className="text-4xl md:text-5xl font-medium text-[#202124] mb-4">Documentation & Support</h1>
            <p className="text-xl text-[#5f6368] max-w-2xl mx-auto mb-12">Get your first workspace running in a few minutes.</p>
            <ol className="w-full max-w-2xl text-left space-y-4">
              {[
                ['Create your workspace', 'Choose “Get started for free”, enter your company and admin details, and pick the modules you need.'],
                ['Sign in as admin', 'Use the email and password you just set. The setup wizard walks you through company profile, projects, team and lead sources.'],
                ['Invite your team', 'In Admin Settings → Users, add teammates and assign roles and projects. They sign in with their own email.'],
                ['Start working', 'Capture leads in LeadSarv CRM, run site operations in ProjectSarv, and keep books in FinanceSarv.'],
              ].map(([title, body], i) => (
                <li key={title} className="flex gap-4 p-5 rounded-2xl border border-[#dadce0] bg-white">
                  <span className="shrink-0 w-8 h-8 rounded-full bg-[#e8f0fe] text-[#1a73e8] font-bold flex items-center justify-center">{i + 1}</span>
                  <div><h2 className="font-bold text-[#202124]">{title}</h2><p className="text-sm text-[#5f6368] mt-1 leading-relaxed">{body}</p></div>
                </li>
              ))}
            </ol>
            <button onClick={() => setCurrentPage('home')} className="mt-12 min-h-11 text-[#1a73e8] font-bold flex items-center gap-2 hover:underline">
                <i className="fas fa-arrow-left text-xs"></i> Back to Overview
            </button>
        </div>
      )}
    </div>
  );
};

// Product mockups (sample data) used instead of stock photos.
const PipelineMock: React.FC = () => (
  <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-2xl border border-green-200/50">
    <div className="flex items-center justify-between mb-4">
      <span className="text-sm font-bold text-[#202124]">Lead pipeline</span>
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#5f6368]">Sample data</span>
    </div>
    <div className="grid grid-cols-3 gap-3">
      {[
        ['Qualified', '#1a73e8', [['Neha Kulkarni', '2BHK · Pune'], ['Vikram Shah', '3BHK · Baner']]],
        ['Site visit', '#1e8e3e', [['Aarav Mehta', 'Sat 11:00'], ['Isha Patil', 'Sun 16:30']]],
        ['Token paid', '#b06000', [['Rohan Desai', '₹1.00L']]],
      ].map(([title, color, cards]: any) => (
        <div key={title} className="bg-[#f8f9fa] rounded-xl p-2.5">
          <div className="flex items-center gap-1.5 mb-2"><span className="w-2 h-2 rounded-full" style={{ background: color }}></span><span className="text-[11px] font-bold text-[#202124]">{title}</span></div>
          <div className="space-y-2">
            {cards.map(([n, d]: string[]) => (
              <div key={n} className="bg-white rounded-lg border border-black/5 shadow-sm p-2.5">
                <p className="text-xs font-bold text-[#202124] truncate">{n}</p>
                <p className="text-[10px] text-[#5f6368] mt-0.5">{d}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ProcurementMock: React.FC = () => (
  <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-2xl border border-[#dadce0]">
    <div className="flex items-center justify-between mb-4">
      <span className="text-sm font-bold text-[#202124]">Purchase approvals</span>
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#5f6368]">Sample data</span>
    </div>
    <div className="divide-y divide-[#f1f3f4] border border-[#f1f3f4] rounded-xl">
      {[
        ['PR-0042', 'Cement OPC 53 · 400 bags', '₹1.52L', 'Project Mgr', 'bg-[#fef7e0] text-[#b06000]'],
        ['PO-0017', 'TMT steel 12mm · 8 MT', '₹4.96L', 'Accounts', 'bg-[#e8f0fe] text-[#1a73e8]'],
        ['PO-0016', 'Excavation · hard rock', '₹6.40L', 'Approved', 'bg-[#e6f4ea] text-[#1e8e3e]'],
      ].map(([id, what, amt, st, cls]) => (
        <div key={id} className="flex items-center justify-between gap-3 px-3 py-3">
          <div className="min-w-0"><p className="text-xs font-bold text-[#202124]">{id}</p><p className="text-[11px] text-[#5f6368] truncate">{what}</p></div>
          <div className="flex items-center gap-3 shrink-0"><span className="text-xs font-bold text-[#202124]">{amt}</span><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cls}`}>{st}</span></div>
        </div>
      ))}
    </div>
    <div className="mt-4 p-3 bg-[#f8f9fa] rounded-xl">
      <p className="text-[11px] font-bold text-[#202124] mb-2">Stock vs minimum level</p>
      {[['Cement', 70], ['Steel', 32]].map(([n, v]: any) => (
        <div key={n} className="flex items-center gap-2 mb-1.5 last:mb-0"><span className="w-12 text-[10px] text-[#5f6368]">{n}</span><div className="flex-1 h-2 bg-[#dadce0] rounded-full overflow-hidden"><div className={`h-full ${v < 40 ? 'bg-[#d93025]' : 'bg-[#1a73e8]'}`} style={{ width: `${v}%` }}></div></div></div>
      ))}
    </div>
  </div>
);

const FeatureCard: React.FC<{ title: string; desc: string; icon: string; color: string; bgColor: string; onClick: () => void }> = ({ title, desc, icon, color, bgColor, onClick }) => (
    <div onClick={onClick} className="p-10 rounded-3xl bg-white border border-[#dadce0] hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer">
        <div className={`w-14 h-14 ${bgColor} rounded-2xl flex items-center justify-center text-2xl mb-8 group-hover:scale-110 transition-transform`} style={{ color }}>
            <i className={icon}></i>
        </div>
        <h3 className="text-2xl font-bold text-[#202124] mb-4">{title}</h3>
        <p className="text-[#5f6368] leading-relaxed mb-8">{desc}</p>
        <button className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 group-hover:underline" style={{ color }}>
            Learn more <i className="fas fa-chevron-right text-[10px]"></i>
        </button>
    </div>
);

const FeatureListItem: React.FC<{ icon: string; title: string; desc: string }> = ({ icon, title, desc }) => (
    <div className="flex gap-6 items-start">
        <div className="w-10 h-10 rounded-lg bg-white border border-[#dadce0] flex flex-shrink-0 items-center justify-center text-[#1a73e8] shadow-sm">
            <i className={icon}></i>
        </div>
        <div>
            <h4 className="font-bold text-[#202124] text-lg mb-1">{title}</h4>
            <p className="text-sm text-[#5f6368] leading-relaxed">{desc}</p>
        </div>
    </div>
);

export default LandingPage;