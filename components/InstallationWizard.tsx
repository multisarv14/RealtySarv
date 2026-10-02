import React from 'react';
import { NewUserData } from '../types';
import { tenantApi } from '../httpClient';
import { workspaceHostSuffix } from '../tenant';
import { PLANS, PlanId, getPlan } from '../plans';

interface InstallationWizardProps {
  /** Creates the workspace and resolves with its sign-in URL (rejects with a readable message). */
  onComplete: (adminData: NewUserData, companyName: string, plan: string, modules: { crm: boolean; erp: boolean }, subdomain: string) => Promise<string>;
  onGoToLogin: () => void;
  /** Plan chosen on the landing page pricing cards. */
  initialPlan?: PlanId;
}

const STEPS = [
  { title: 'Your details', description: 'Owner account' },
  { title: 'Your company', description: 'Name and address' },
  { title: 'Choose a plan', description: 'What’s included' },
  { title: 'Review', description: 'Create workspace' },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD = 6;

type Errors = Record<string, string>;
type SubStatus = { state: 'idle' | 'checking' | 'ok' | 'bad'; reason?: string };

const VerticalStepper: React.FC<{ currentStep: number }> = ({ currentStep }) => (
  <ol className="flex flex-col gap-8 py-6">
    {STEPS.map((step, index) => {
      const stepNum = index + 1;
      const isActive = stepNum === currentStep;
      const isCompleted = stepNum < currentStep;
      return (
        <li key={step.title} className="flex items-start gap-5 relative" aria-current={isActive ? 'step' : undefined}>
          {index < STEPS.length - 1 && (
            <div className={`absolute left-[15px] top-8 bottom-[-32px] w-0.5 ${isCompleted ? 'bg-[#1a73e8]' : 'bg-[#dadce0]'} transition-colors duration-500`}></div>
          )}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 transition-all duration-300 ${isActive || isCompleted ? 'bg-[#1a73e8] border-[#1a73e8] text-white' : 'bg-white border-[#dadce0] text-gray-400'} ${isActive ? 'shadow-lg' : ''}`}>
            {isCompleted ? <i className="fas fa-check text-[10px]" aria-hidden="true"></i> : <span className="text-xs font-bold">{stepNum}</span>}
          </div>
          <div className={`flex flex-col transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-60'}`}>
            <span className={`text-sm font-bold ${isActive ? 'text-[#1a73e8]' : 'text-gray-700'}`}>{step.title}</span>
            <span className="text-xs text-gray-500">{step.description}</span>
          </div>
        </li>
      );
    })}
  </ol>
);

const InstallationWizard: React.FC<InstallationWizardProps> = ({ onComplete, onGoToLogin, initialPlan }) => {
  const [step, setStep] = React.useState(1);
  const [status, setStatus] = React.useState<'form' | 'creating' | 'done'>('form');
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [showErrors, setShowErrors] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [subStatus, setSubStatus] = React.useState<SubStatus>({ state: 'idle' });
  const [formData, setFormData] = React.useState({
    plan: (initialPlan ?? PLANS[0].id) as PlanId,
    companyName: '',
    subdomain: '',
    adminName: '',
    adminEmail: '',
    adminPhone: '',
    adminUsername: '',
    adminPassword: '',
    adminConfirmPassword: '',
  });
  const [builtUrl, setBuiltUrl] = React.useState('');

  const plan = getPlan(formData.plan);
  const address = `${formData.subdomain}${workspaceHostSuffix()}`;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // The address becomes part of a web address: lowercase letters, numbers and hyphens only.
    const next = name === 'subdomain' ? value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30) : value;
    setFormData((prev) => ({ ...prev, [name]: next }));
  };

  // Live "is this address free?" check while the owner types.
  React.useEffect(() => {
    const sub = formData.subdomain;
    if (!sub) { setSubStatus({ state: 'idle' }); return; }
    setSubStatus({ state: 'checking' });
    let alive = true;
    const timer = setTimeout(() => {
      tenantApi.check(sub)
        .then((r) => { if (alive) setSubStatus(r.available ? { state: 'ok' } : { state: 'bad', reason: r.reason }); })
        .catch(() => { if (alive) setSubStatus({ state: 'bad', reason: 'Could not check this address. Is the server running?' }); });
    }, 400);
    return () => { alive = false; clearTimeout(timer); };
  }, [formData.subdomain]);

  const errorsFor = (s: number): Errors => {
    const e: Errors = {};
    if (s === 1) {
      if (!formData.adminName.trim()) e.adminName = 'Enter your full name.';
      if (!EMAIL_RE.test(formData.adminEmail.trim())) e.adminEmail = 'Enter a valid email, like name@company.com.';
      if (formData.adminUsername.trim().length < 3) e.adminUsername = 'Choose a username of at least 3 characters.';
      if (formData.adminPhone.replace(/\D/g, '').length < 8) e.adminPhone = 'Enter a valid mobile number.';
      if (formData.adminPassword.length < MIN_PASSWORD) e.adminPassword = `Use at least ${MIN_PASSWORD} characters.`;
      if (formData.adminConfirmPassword !== formData.adminPassword) e.adminConfirmPassword = 'Passwords don’t match.';
    }
    if (s === 2) {
      if (!formData.companyName.trim()) e.companyName = 'Enter your company name.';
      if (!formData.subdomain) e.subdomain = 'Choose the address your team will sign in at.';
      else if (subStatus.state === 'bad') e.subdomain = subStatus.reason || 'Choose a different address.';
      else if (subStatus.state === 'checking') e.subdomain = 'Checking that address…';
    }
    return e;
  };
  const errors = errorsFor(step);
  const err = (k: string) => (showErrors ? errors[k] : undefined);

  const goTo = (n: number) => { setStep(n); setShowErrors(false); setServerError(null); };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(errors).length) { setShowErrors(true); return; }
    if (step < STEPS.length) { goTo(step + 1); return; }
    handleCreate();
  };

  const handleCreate = async () => {
    setStatus('creating');
    setServerError(null);
    try {
      const url = await onComplete({
        name: formData.adminName.trim(),
        email: formData.adminEmail.trim(),
        phone: formData.adminPhone.trim(),
        username: formData.adminUsername.trim(),
        password: formData.adminPassword,
        role: 'Admin',
        assignedProjectIds: [],
      }, formData.companyName.trim(), plan.id, plan.modules, formData.subdomain);
      setBuiltUrl(url);
      setStatus('done');
      await new Promise((r) => setTimeout(r, 1400));
      window.location.href = url;
    } catch (e: any) {
      const message = e?.message || 'Could not create the workspace.';
      setServerError(message);
      setStatus('form');
      if (/address|taken|reserved/i.test(message)) { setStep(2); setShowErrors(true); }
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <Heading title="Create the owner account" sub="You’ll be the administrator of your company’s workspace and can add your team later." />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormInput label="Full name" name="adminName" value={formData.adminName} onChange={handleInputChange} placeholder="Your full name" autoComplete="name" error={err('adminName')} autoFocus />
              <FormInput label="Work email" name="adminEmail" type="email" value={formData.adminEmail} onChange={handleInputChange} placeholder="name@company.com" autoComplete="email" error={err('adminEmail')} />
              <FormInput label="Username" name="adminUsername" value={formData.adminUsername} onChange={handleInputChange} placeholder="e.g. rita" autoComplete="username" error={err('adminUsername')} />
              <FormInput label="Mobile number" name="adminPhone" type="tel" value={formData.adminPhone} onChange={handleInputChange} placeholder="+91 98765 43210" autoComplete="tel" error={err('adminPhone')} />
              <FormInput label="Password" name="adminPassword" type={showPassword ? 'text' : 'password'} value={formData.adminPassword} onChange={handleInputChange} placeholder="Create a password" autoComplete="new-password" error={err('adminPassword')} hint={`At least ${MIN_PASSWORD} characters.`}
                trailing={<ToggleEye shown={showPassword} onToggle={() => setShowPassword((v) => !v)} />} />
              <FormInput label="Confirm password" name="adminConfirmPassword" type={showPassword ? 'text' : 'password'} value={formData.adminConfirmPassword} onChange={handleInputChange} placeholder="Re-enter your password" autoComplete="new-password" error={err('adminConfirmPassword')} />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <Heading title="Tell us about your company" sub="Your team will sign in at your own web address." />
            <FormInput label="Company name" name="companyName" value={formData.companyName} onChange={handleInputChange} placeholder="e.g. Skyline Developers" autoComplete="organization" error={err('companyName')} autoFocus />
            <div>
              <label htmlFor="subdomain" className="block text-sm font-medium text-[#202124] mb-1.5">Your sign-in address</label>
              <div className="flex items-stretch">
                <input
                  id="subdomain" name="subdomain" value={formData.subdomain} onChange={handleInputChange} placeholder="your-company"
                  autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false}
                  aria-invalid={!!err('subdomain')} aria-describedby="subdomain-note"
                  className={`min-w-0 flex-1 h-12 px-4 rounded-l-lg border border-r-0 text-base text-[#202124] placeholder-[#80868b] bg-white focus:outline-none focus:ring-2 ${err('subdomain') ? 'border-[#d93025] focus:ring-[#d93025]/30' : 'border-[#dadce0] focus:border-[#1a73e8] focus:ring-[#1a73e8]/30'}`}
                />
                <span className="h-12 px-3 flex items-center rounded-r-lg border border-[#dadce0] bg-[#f1f3f4] text-sm font-medium text-[#5f6368] whitespace-nowrap">{workspaceHostSuffix()}</span>
              </div>
              <p id="subdomain-note" aria-live="polite" className={`mt-1.5 text-xs ${subStatus.state === 'ok' ? 'text-[#1e8e3e]' : subStatus.state === 'bad' || err('subdomain') ? 'text-[#d93025]' : 'text-[#5f6368]'}`}>
                {subStatus.state === 'checking' && 'Checking availability…'}
                {subStatus.state === 'ok' && <>✓ <b>{address}</b> is available.</>}
                {subStatus.state === 'bad' && subStatus.reason}
                {subStatus.state === 'idle' && (err('subdomain') || 'Letters, numbers and hyphens. This is the address your team will use to sign in.')}
              </p>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <Heading title="Choose a plan" sub="Pick what fits your team. You won’t be charged today." />
            <div role="radiogroup" aria-label="Plan" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {PLANS.map((p) => (
                <PlanCard key={p.id} title={p.id} tagline={p.tagline} price={p.price} features={p.features} active={formData.plan === p.id}
                  onClick={() => setFormData((prev) => ({ ...prev, plan: p.id }))} />
              ))}
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            {status === 'form' && (
              <>
                <Heading title="Review and create" sub="Check your details. You can change most of these later in settings." />
                {serverError && <div role="alert" className="text-sm text-[#d93025] bg-red-50 border border-red-100 rounded-lg p-3">{serverError}</div>}
                <dl className="bg-[#f8f9fa] p-5 sm:p-6 rounded-xl border border-[#dadce0] space-y-3">
                  <Row label="Owner" value={`${formData.adminName} · ${formData.adminEmail}`} />
                  <Row label="Company" value={formData.companyName} />
                  <Row label="Sign-in address" value={address} />
                  <Row label="Plan" value={`${plan.id} · ${plan.price}/mo`} />
                  <Row label="Includes" value={plan.moduleNames.join(', ')} />
                </dl>
              </>
            )}
            {status === 'creating' && (
              <div className="py-10 text-center" role="status">
                <div className="w-12 h-12 mx-auto mb-5 border-4 border-blue-100 border-t-[#1a73e8] rounded-full animate-spin"></div>
                <h2 className="text-2xl font-medium text-[#202124]">Creating your workspace…</h2>
                <p className="text-sm text-[#5f6368] mt-2">Setting up <b>{address}</b> with its own private database. This takes a few seconds.</p>
              </div>
            )}
            {status === 'done' && (
              <div className="py-10 text-center" role="status">
                <div className="w-16 h-16 mx-auto mb-5 bg-green-50 text-green-600 rounded-full flex items-center justify-center text-2xl"><i className="fas fa-check" aria-hidden="true"></i></div>
                <h2 className="text-2xl font-medium text-[#202124]">Your workspace is ready</h2>
                <p className="text-sm text-[#5f6368] mt-2">Taking you to <b>{address}</b>…</p>
                <a href={builtUrl} className="inline-block mt-4 text-sm font-bold text-[#1a73e8] hover:underline">Not redirected? Continue</a>
              </div>
            )}
          </div>
        );
    }
  };

  const busy = status !== 'form';

  return (
    <div className="fixed inset-0 bg-[#f1f3f4] flex items-stretch md:items-center justify-center md:p-4 z-[9999] overflow-hidden">
      <div className="w-full max-w-6xl h-full md:max-h-[800px] bg-white md:rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-72 bg-[#f8f9fa] p-8 flex-col border-r border-[#dadce0] flex-shrink-0">
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 bg-[#1a73e8] rounded flex items-center justify-center text-white text-sm shadow-sm"><i className="fas fa-cube" aria-hidden="true"></i></div>
              <span className="text-2xl font-bold text-[#202124] tracking-tight">RealtySarv</span>
            </div>
            <p className="text-xs text-[#5f6368] ml-11">Set up your workspace</p>
          </div>
          <VerticalStepper currentStep={step} />
        </aside>

        {/* Mobile header: compact progress instead of the full stepper */}
        <header className="md:hidden px-5 pt-4 pb-3 border-b border-[#dadce0] bg-[#f8f9fa]">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-lg font-bold text-[#202124]">
              <span className="w-7 h-7 bg-[#1a73e8] rounded flex items-center justify-center text-white text-xs"><i className="fas fa-cube" aria-hidden="true"></i></span>
              RealtySarv
            </span>
            <span className="text-xs font-medium text-[#5f6368]">Step {step} of {STEPS.length}</span>
          </div>
          <p className="mt-2 text-sm font-bold text-[#1a73e8]">{STEPS[step - 1].title}</p>
          <div className="mt-2 h-1.5 rounded-full bg-[#dadce0] overflow-hidden" aria-hidden="true">
            <div className="h-full bg-[#1a73e8] transition-all duration-300" style={{ width: `${(step / STEPS.length) * 100}%` }}></div>
          </div>
        </header>

        <main className="flex-1 flex flex-col min-w-0 bg-white min-h-0">
          <form onSubmit={handleNext} noValidate className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto p-5 sm:p-8 md:p-12 custom-scrollbar">
              <div className="max-w-3xl mx-auto animate-fadeIn">{renderStep()}</div>
            </div>
            <div className="px-5 sm:px-8 md:px-12 py-4 border-t border-[#dadce0] flex items-center justify-between gap-3 bg-white">
              <button type="button" onClick={onGoToLogin} disabled={status === 'creating'} className="min-h-11 px-2 text-sm font-medium text-[#5f6368] hover:text-[#202124] disabled:opacity-50">
                Exit setup
              </button>
              {!busy && (
                <div className="flex gap-2 sm:gap-3">
                  {step > 1 && (
                    <button type="button" onClick={() => goTo(step - 1)} className="min-h-11 px-5 rounded-lg font-bold text-sm text-[#1a73e8] hover:bg-blue-50 transition-colors">Back</button>
                  )}
                  <button type="submit" className="min-h-11 px-6 sm:px-8 rounded-lg bg-[#1a73e8] text-white font-bold text-sm shadow hover:bg-[#174ea6] transition-colors">
                    {step === STEPS.length ? 'Create workspace' : 'Continue'}
                  </button>
                </div>
              )}
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

const Heading: React.FC<{ title: string; sub: string }> = ({ title, sub }) => (
  <div>
    <h1 className="text-2xl sm:text-3xl font-medium text-[#202124] mb-2">{title}</h1>
    <p className="text-sm text-[#5f6368]">{sub}</p>
  </div>
);

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-4">
    <dt className="text-xs text-gray-500">{label}</dt>
    <dd className="text-sm font-bold text-[#202124] sm:text-right break-words">{value}</dd>
  </div>
);

const ToggleEye: React.FC<{ shown: boolean; onToggle: () => void }> = ({ shown, onToggle }) => (
  <button type="button" onClick={onToggle} aria-label={shown ? 'Hide password' : 'Show password'} aria-pressed={shown}
    className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-[#5f6368] hover:text-[#202124] rounded-lg">
    <i className={`fas ${shown ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true"></i>
  </button>
);

const FormInput: React.FC<{
  label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder: string;
  type?: string; autoComplete?: string; error?: string; hint?: string; autoFocus?: boolean; trailing?: React.ReactNode;
}> = ({ label, name, value, onChange, placeholder, type = 'text', autoComplete, error, hint, autoFocus, trailing }) => (
  <div className="w-full">
    <label htmlFor={name} className="block text-sm font-medium text-[#202124] mb-1.5">{label}</label>
    <div className="relative">
      <input
        id={name} name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete} autoFocus={autoFocus}
        aria-invalid={!!error} aria-describedby={error ? `${name}-err` : undefined}
        className={`w-full h-12 px-4 ${trailing ? 'pr-12' : ''} rounded-lg border text-base text-[#202124] placeholder-[#80868b] bg-white focus:outline-none focus:ring-2 transition-colors ${error ? 'border-[#d93025] focus:ring-[#d93025]/30' : 'border-[#dadce0] focus:border-[#1a73e8] focus:ring-[#1a73e8]/30'}`}
      />
      {trailing}
    </div>
    {error && <p id={`${name}-err`} className="mt-1.5 text-xs text-[#d93025] flex items-center gap-1.5"><i className="fas fa-exclamation-circle" aria-hidden="true"></i>{error}</p>}
    {!error && hint && <p className="mt-1.5 text-xs text-[#5f6368]">{hint}</p>}
  </div>
);

const PlanCard: React.FC<{ title: string; tagline: string; price: string; features: string[]; active: boolean; onClick: () => void }> = ({ title, tagline, price, features, active, onClick }) => (
  <button
    type="button" role="radio" aria-checked={active} onClick={onClick}
    className={`text-left p-5 sm:p-6 rounded-xl border-2 transition-all flex flex-col ${active ? 'border-[#1a73e8] bg-blue-50/40 shadow-md ring-4 ring-[#1a73e8]/10' : 'border-[#dadce0] hover:border-[#1a73e8]/50'}`}
  >
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="font-bold text-lg text-[#202124]">{title}</h2>
        <p className="text-xs text-[#5f6368] mt-0.5">{tagline}</p>
      </div>
      <span className={`w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center ${active ? 'bg-[#1a73e8] border-[#1a73e8] text-white' : 'border-[#dadce0]'}`}>
        {active && <i className="fas fa-check text-[10px]" aria-hidden="true"></i>}
      </span>
    </div>
    <div className="text-3xl font-medium text-[#202124] my-4">{price}<span className="text-xs text-gray-500 font-medium ml-1">/month</span></div>
    <ul className="space-y-2.5">
      {features.map((f) => (
        <li key={f} className="text-sm text-[#5f6368] flex items-start gap-2"><i className="fas fa-check text-blue-500 mt-1 text-xs" aria-hidden="true"></i><span>{f}</span></li>
      ))}
    </ul>
  </button>
);

export default InstallationWizard;
