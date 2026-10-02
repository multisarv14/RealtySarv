import React from 'react';
import { tenantApi } from '../httpClient';
import { tenantUrl, workspaceHostSuffix } from '../tenant';

interface WorkspaceFinderProps {
  onGoToInstall: () => void;
  onBackToLanding: () => void;
}

// Main-site "Sign in": clients sign in on their own company address, so first find it.
const WorkspaceFinder: React.FC<WorkspaceFinderProps> = ({ onGoToInstall, onBackToLanding }) => {
  const [sub, setSub] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = sub.trim().toLowerCase();
    if (!name) { setError('Enter your company’s workspace address.'); return; }
    setBusy(true); setError(null);
    try {
      const { exists } = await tenantApi.exists(name);
      if (exists) { window.location.href = tenantUrl(name); return; }
      setError(`We couldn’t find a workspace called “${name}”. Check the spelling, or ask your admin for your company’s sign-in address.`);
    } catch {
      setError('Can’t reach the server. Check your connection and try again.');
    } finally { setBusy(false); }
  };

  return (
    <div className="relative min-h-screen w-full bg-white flex flex-col items-center justify-center px-4 py-20 sm:px-6 font-sans overflow-y-auto">
      <button type="button" onClick={onBackToLanding} className="absolute top-3 left-3 sm:top-6 sm:left-6 min-h-11 px-3 text-[#5f6368] hover:text-[#1a73e8] font-medium text-sm flex items-center gap-2 rounded-lg">
        <i className="fas fa-arrow-left text-xs" aria-hidden="true"></i> Back to overview
      </button>
      <main className="w-full max-w-[440px] bg-white rounded-3xl border border-[#dadce0] p-6 sm:p-10 shadow-[0_1px_3px_0_rgba(60,64,67,0.3),0_4px_8px_3px_rgba(60,64,67,0.15)]">
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 bg-[#1a73e8] rounded-sm flex items-center justify-center text-white shadow-sm"><i className="fas fa-cube text-xs" aria-hidden="true"></i></div>
            <span className="text-2xl font-medium tracking-tight text-[#5f6368]">Realty<span className="text-[#202124] font-bold">Sarv</span></span>
          </div>
          <h1 className="text-2xl font-medium text-[#202124] text-center">Find your workspace</h1>
          <p className="text-[#5f6368] text-sm mt-1.5 text-center">Enter your company’s RealtySarv address to sign in.</p>
        </div>

        <form onSubmit={submit} noValidate className="space-y-4">
          {error && (
            <div id="login-error-alert" role="alert" className="text-sm text-[#d93025] flex items-start gap-2 bg-red-50 p-3 rounded-lg border border-red-100">
              <i className="fas fa-exclamation-circle mt-0.5 shrink-0" aria-hidden="true"></i><span>{error}</span>
            </div>
          )}
          <div>
            <label htmlFor="workspace" className="block text-sm font-medium text-[#202124] mb-1.5">Workspace address</label>
            <div className="flex items-stretch">
              <input
                id="workspace" name="workspace" type="text" autoFocus autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false}
                value={sub} onChange={(e) => setSub(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="yourcompany"
                className="min-w-0 flex-1 h-12 px-4 rounded-l-lg border border-r-0 border-[#dadce0] text-base text-[#202124] placeholder-[#80868b] focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/30 focus:border-[#1a73e8]"
              />
              <span className="h-12 px-3 flex items-center rounded-r-lg border border-[#dadce0] bg-[#f1f3f4] text-sm font-medium text-[#5f6368] whitespace-nowrap">{workspaceHostSuffix()}</span>
            </div>
          </div>
          <button type="submit" disabled={busy} className="w-full h-12 bg-[#1a73e8] text-white rounded-lg font-bold text-sm hover:bg-[#174ea6] disabled:opacity-70 disabled:cursor-not-allowed transition-colors shadow-md flex items-center justify-center gap-2">
            {busy ? <><i className="fas fa-circle-notch fa-spin" aria-hidden="true"></i> Looking…</> : 'Continue'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#e8eaed] text-sm text-[#5f6368] text-center">
          Setting up a new company?{' '}
          <button type="button" onClick={onGoToInstall} className="min-h-11 px-1 font-bold text-[#1a73e8] hover:underline">Start free</button>
        </div>
      </main>
    </div>
  );
};

export default WorkspaceFinder;
