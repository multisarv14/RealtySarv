import React from 'react';
import { User } from '../types';
import { authApi, setToken } from '../httpClient';
import { notifyAll } from '../liveQuery';
import { mainSiteUrl } from '../tenant';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
  onGoToInstall: () => void;
}

type Mode = 'signin' | 'signup';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD = 6;

const inputClass = (invalid: boolean) =>
  `w-full h-12 px-4 rounded-lg border text-base text-[#202124] placeholder-[#80868b] bg-white focus:outline-none focus:ring-2 transition-colors ${
    invalid ? 'border-[#d93025] focus:ring-[#d93025]/30' : 'border-[#dadce0] focus:border-[#1a73e8] focus:ring-[#1a73e8]/30'
  }`;

const friendlyError = (err: any): string => {
  if (err?.status === 401) return 'That email/username and password don’t match. Please try again.';
  if (err?.status === 403) return err.message || 'Your account is disabled. Contact your workspace admin.';
  if (err?.status === 409) return 'This email already has an account. Sign in instead.';
  if (err?.status) return err.message || 'Something went wrong. Please try again.';
  return 'Can’t reach the server. Check your connection and try again.';
};

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onGoToInstall }) => {
  const [mode, setMode] = React.useState<Mode>('signin');
  const [name, setName] = React.useState('');
  const [identity, setIdentity] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [touched, setTouched] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  // The company comes from the address in the browser (acme.realtysarv.com); the server tells us its name.
  const [workspace, setWorkspace] = React.useState<{ name: string; subdomain: string; allowSignup?: boolean } | null>(null);
  const [notFound, setNotFound] = React.useState(false);
  React.useEffect(() => {
    authApi.workspace().then(setWorkspace).catch((e) => { if (e?.status === 404 || e?.status === 400) setNotFound(true); });
  }, []);
  const allowSignup = workspace?.allowSignup === true;
  const workspaceName = workspace?.name || '';

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setTouched(false);
    setPassword('');
    setConfirm('');
    setShowPassword(false);
    if (next === 'signup' && !EMAIL_RE.test(identity.trim())) setIdentity('');
  };

  // Field-level validation, shown only after the first submit attempt.
  const mail = identity.trim().toLowerCase();
  const errors: Record<string, string> = {};
  if (mode === 'signup') {
    if (!name.trim()) errors.name = 'Enter your full name.';
    if (!EMAIL_RE.test(mail)) errors.identity = 'Enter a valid email address, like name@company.com.';
    if (password.length < MIN_PASSWORD) errors.password = `Use at least ${MIN_PASSWORD} characters.`;
    if (confirm !== password) errors.confirm = 'Passwords don’t match.';
  } else {
    if (!mail) errors.identity = 'Enter your email or username.';
    if (!password) errors.password = 'Enter your password.';
  }
  const show = (k: string) => (touched ? errors[k] : undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setError(null);
    if (Object.keys(errors).length) return;

    setIsLoading(true);
    try {
      const result: any = mode === 'signup'
        ? await authApi.register({ name: name.trim(), email: mail, password })
        : await authApi.login(mail, password);
      setToken(result.token);
      notifyAll();
      onLoginSuccess(result.user as User);
    } catch (err: any) {
      setError(friendlyError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const isSignup = mode === 'signup';

  if (notFound) {
    return (
      <div className="min-h-screen w-full bg-white flex items-center justify-center px-4 py-16 font-sans">
        <main className="w-full max-w-[440px] text-center bg-white rounded-3xl border border-[#dadce0] p-8 sm:p-10 shadow-[0_1px_3px_0_rgba(60,64,67,0.3),0_4px_8px_3px_rgba(60,64,67,0.15)]">
          <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center text-2xl"><i className="fas fa-compass" aria-hidden="true"></i></div>
          <h1 className="text-2xl font-medium text-[#202124]">Workspace not found</h1>
          <p className="text-sm text-[#5f6368] mt-2 leading-relaxed"><b>{window.location.hostname}</b> isn’t a RealtySarv workspace. Check the address your admin gave you, or find your workspace by name.</p>
          <a href={mainSiteUrl('#find')} className="mt-6 inline-flex items-center justify-center w-full h-12 bg-[#1a73e8] text-white rounded-lg font-bold text-sm hover:bg-[#174ea6]">Find your workspace</a>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-white flex flex-col items-center justify-center px-4 py-20 sm:px-6 font-sans overflow-y-auto">
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-[120px] opacity-60"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-50 rounded-full blur-[120px] opacity-60"></div>
      </div>

      <a
        href={mainSiteUrl()}
        className="absolute top-3 left-3 sm:top-6 sm:left-6 min-h-11 px-3 text-[#5f6368] hover:text-[#1a73e8] font-medium text-sm flex items-center gap-2 transition-colors z-50 rounded-lg"
      >
        <i className="fas fa-arrow-left text-xs" aria-hidden="true"></i> RealtySarv home
      </a>

      <main className="w-full max-w-[440px] bg-white rounded-3xl border border-[#dadce0] p-6 sm:p-10 shadow-[0_1px_3px_0_rgba(60,64,67,0.3),0_4px_8px_3px_rgba(60,64,67,0.15)] z-10 relative">
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 bg-[#1a73e8] rounded-sm flex items-center justify-center text-white shadow-sm">
              <i className="fas fa-cube text-xs" aria-hidden="true"></i>
            </div>
            <span className="text-2xl font-medium tracking-tight text-[#5f6368]">
              Realty<span className="text-[#202124] font-bold">Sarv</span>
            </span>
          </div>
          <h1 className="text-2xl font-medium text-[#202124] text-center">{isSignup ? 'Create your account' : 'Sign in'}</h1>
          <p className="text-[#5f6368] text-sm mt-1.5 text-center">
            {isSignup ? 'Join your team’s RealtySarv workspace.' : 'Welcome back. Sign in to continue.'}
          </p>
        </div>

        {/* Workspace (fixed by the address; to use another company, open that company's address) */}
        <div className="mb-6 flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-1 py-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <i className="fas fa-building text-[#1a73e8] text-sm" aria-hidden="true"></i>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 leading-tight">{isSignup ? 'Joining workspace' : 'Workspace'}</p>
              <p id="active-workspace-name" className="text-sm font-bold text-slate-800 truncate">{workspaceName || window.location.hostname}</p>
            </div>
          </div>
          <a href={mainSiteUrl('#find')} className="min-h-11 px-3 flex items-center text-sm font-bold text-[#1a73e8] hover:underline shrink-0">Not yours?</a>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div id="login-error-alert" role="alert" aria-live="polite" className={error ? 'text-sm text-[#d93025] flex items-start gap-2 bg-red-50 p-3 rounded-lg border border-red-100' : 'sr-only'}>
            {error && <><i className="fas fa-exclamation-circle mt-0.5 shrink-0" aria-hidden="true"></i><span>{error}</span></>}
          </div>

          {isSignup && (
            <Field id="fullname" label="Full name" error={show('name')}>
              <input id="fullname" name="name" type="text" autoComplete="name" autoFocus value={name} onChange={(e) => setName(e.target.value)}
                aria-invalid={!!show('name')} aria-describedby={show('name') ? 'fullname-err' : undefined} className={inputClass(!!show('name'))} placeholder="Your full name" />
            </Field>
          )}

          <Field id="username" label={isSignup ? 'Work email' : 'Email or username'} error={show('identity')}>
            <input
              id="username"
              name={isSignup ? 'email' : 'username'}
              type={isSignup ? 'email' : 'text'}
              inputMode={isSignup ? 'email' : undefined}
              autoComplete={isSignup ? 'email' : 'username'}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoFocus={!isSignup}
              value={identity}
              onChange={(e) => setIdentity(e.target.value)}
              aria-invalid={!!show('identity')}
              aria-describedby={show('identity') ? 'username-err' : undefined}
              className={inputClass(!!show('identity'))}
              placeholder={isSignup ? 'name@company.com' : 'Email or username'}
            />
          </Field>

          <Field id="password" label="Password" error={show('password')} hint={isSignup && !show('password') ? `At least ${MIN_PASSWORD} characters.` : undefined}>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!show('password')}
                aria-describedby={show('password') ? 'password-err' : undefined}
                className={`${inputClass(!!show('password'))} pr-12`}
                placeholder={isSignup ? 'Create a password' : 'Your password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-[#5f6368] hover:text-[#202124] rounded-lg"
              >
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true"></i>
              </button>
            </div>
          </Field>

          {isSignup && (
            <Field id="confirm" label="Confirm password" error={show('confirm')}>
              <input id="confirm" name="confirm" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                aria-invalid={!!show('confirm')} aria-describedby={show('confirm') ? 'confirm-err' : undefined} className={inputClass(!!show('confirm'))} placeholder="Re-enter your password" />
            </Field>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-[#1a73e8] text-white rounded-lg font-bold text-sm hover:bg-[#174ea6] disabled:opacity-70 disabled:cursor-not-allowed transition-colors shadow-md flex items-center justify-center gap-2"
          >
            {isLoading
              ? <><i className="fas fa-circle-notch fa-spin" aria-hidden="true"></i> {isSignup ? 'Creating account…' : 'Signing in…'}</>
              : (isSignup ? 'Create account' : 'Sign in')}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#e8eaed] text-sm text-[#5f6368] space-y-1 text-center">
          {allowSignup && (
            <p>
              {isSignup ? 'Already have an account?' : 'New to this workspace?'}{' '}
              <button type="button" onClick={() => switchMode(isSignup ? 'signin' : 'signup')} className="min-h-11 px-1 font-bold text-[#1a73e8] hover:underline">
                {isSignup ? 'Sign in' : 'Create an account'}
              </button>
            </p>
          )}
          {!isSignup && <p className="text-xs text-[#5f6368]">Forgot your password? Ask your workspace admin to reset it.</p>}
          <p>
            Setting up a new company?{' '}
            <button type="button" onClick={onGoToInstall} className="min-h-11 px-1 font-bold text-[#1a73e8] hover:underline">Start free</button>
          </p>
        </div>
      </main>
    </div>
  );
};

const Field: React.FC<{ id: string; label: string; error?: string; hint?: string; children: React.ReactNode }> = ({ id, label, error, hint, children }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-[#202124] mb-1.5">{label}</label>
    {children}
    {error && <p id={`${id}-err`} className="mt-1.5 text-xs text-[#d93025] flex items-center gap-1.5"><i className="fas fa-exclamation-circle" aria-hidden="true"></i>{error}</p>}
    {!error && hint && <p className="mt-1.5 text-xs text-[#5f6368]">{hint}</p>}
  </div>
);

export default LoginPage;
