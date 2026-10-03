
import React from 'react';
import { SystemType } from '../types';

interface SystemSwitcherProps {
  activeSystem: SystemType;
  onSwitch: (system: SystemType) => void;
  onGoToAdmin: () => void;
  currentAppView: 'main' | 'admin';
  /** Modules not included in the company's plan: shown with a lock and not clickable. */
  lockedSystems?: SystemType[];
  /** Whether the signed-in user's role may open Admin settings. */
  canOpenAdmin?: boolean;
}

const SystemSwitcher: React.FC<SystemSwitcherProps> = ({ activeSystem, onSwitch, onGoToAdmin, currentAppView, lockedSystems = [], canOpenAdmin = true }) => {
  const locked = (sys: SystemType) => lockedSystems.includes(sys);
  return (
    <div className="bg-[var(--dark-bg)] border-b border-[var(--light-bg)] px-3 h-10 flex items-center justify-between z-50 flex-shrink-0 shadow-lg">
      <div className="flex items-center gap-1 h-full">
        <button 
          onClick={() => onSwitch('LeadSarv')}
          className={`h-full px-4 flex items-center gap-2 transition-all border-b-2 relative group ${
            activeSystem === 'LeadSarv' 
            ? 'border-[#00a884] text-[#00a884] bg-[#00a884]/5 font-bold' 
            : 'border-transparent text-[var(--text-secondary)] hover:text-[#00a884] hover:bg-[#00a884]/5'
          }`}
        >
          <div className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${activeSystem === 'LeadSarv' ? 'bg-[#00a884] text-white' : 'bg-gray-700 text-gray-400 group-hover:bg-gray-600'}`}>
            <i className="fas fa-users-rays text-[10px]"></i>
          </div>
          <span className="text-[11px] uppercase tracking-widest hidden sm:flex items-center">
            <span className="font-bold">Lead</span><span className="font-light opacity-80">Sarv</span>
          </span>
          {activeSystem === 'LeadSarv' && <div className="absolute -bottom-[2px] left-0 right-0 h-[2px] bg-[#00a884] shadow-[0_0_12px_#00a884]"></div>}
        </button>

        <button 
          onClick={() => !locked('ProjectSarv') && onSwitch('ProjectSarv')}
          disabled={locked('ProjectSarv')}
          title={locked('ProjectSarv') ? 'Included in the Ultimate Stack plan' : undefined}
          className={`h-full px-4 flex items-center gap-2 transition-all border-b-2 relative group ${locked('ProjectSarv') ? 'opacity-50 cursor-not-allowed ' : ''}${
            activeSystem === 'ProjectSarv' 
            ? 'border-[#3b82f6] text-[#3b82f6] bg-[#3b82f6]/5 font-bold' 
            : 'border-transparent text-[var(--text-secondary)] hover:text-[#3b82f6] hover:bg-[#3b82f6]/5'
          }`}
        >
          <div className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${activeSystem === 'ProjectSarv' ? 'bg-[#3b82f6] text-white' : 'bg-gray-700 text-gray-400 group-hover:bg-gray-600'}`}>
            <i className="fas fa-hard-hat text-[10px]"></i>
          </div>
          <span className="text-[11px] uppercase tracking-widest hidden sm:flex items-center">
            <span className="font-bold">Project</span><span className="font-light opacity-80">Sarv</span>
          </span>
          {locked('ProjectSarv') && <i className="fas fa-lock text-[10px] opacity-70" aria-hidden="true"></i>}
           {activeSystem === 'ProjectSarv' && <div className="absolute -bottom-[2px] left-0 right-0 h-[2px] bg-[#3b82f6] shadow-[0_0_12px_#3b82f6]"></div>}
        </button>

        <button 
          onClick={() => !locked('FinanceSarv') && onSwitch('FinanceSarv')}
          disabled={locked('FinanceSarv')}
          title={locked('FinanceSarv') ? 'Included in the Ultimate Stack plan' : undefined}
          className={`h-full px-4 flex items-center gap-2 transition-all border-b-2 relative group ${locked('FinanceSarv') ? 'opacity-50 cursor-not-allowed ' : ''}${
            activeSystem === 'FinanceSarv' 
            ? 'border-[#6366f1] text-[#6366f1] bg-[#6366f1]/5 font-bold' 
            : 'border-transparent text-[var(--text-secondary)] hover:text-[#6366f1] hover:bg-[#6366f1]/5'
          }`}
        >
          <div className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${activeSystem === 'FinanceSarv' ? 'bg-[#6366f1] text-white' : 'bg-gray-700 text-gray-400 group-hover:bg-gray-600'}`}>
            <i className="fas fa-coins text-[10px]"></i>
          </div>
          <span className="text-[11px] uppercase tracking-widest hidden sm:flex items-center">
            <span className="font-bold">Finance</span><span className="font-light opacity-80">Sarv</span>
          </span>
          {locked('FinanceSarv') && <i className="fas fa-lock text-[10px] opacity-70" aria-hidden="true"></i>}
           {activeSystem === 'FinanceSarv' && <div className="absolute -bottom-[2px] left-0 right-0 h-[2px] bg-[#6366f1] shadow-[0_0_12px_#6366f1]"></div>}
        </button>
      </div>

      <div className="flex items-center gap-3">
        {currentAppView === 'main' && canOpenAdmin && (
          <button 
            id="topbar-admin-btn"
            onClick={onGoToAdmin}
            className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 hover:border-blue-500/50 text-blue-400 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm hover:scale-[1.02]"
            title="Open Admin Settings Control Panel"
          >
            <i className="fas fa-cog text-xs animate-spin-slow"></i>
            Admin Settings
          </button>
        )}

        <div className="h-4 w-px bg-gray-700"></div>

        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow-md transition-all ${
            activeSystem === 'LeadSarv' ? 'bg-[#00a884]' : 
            activeSystem === 'ProjectSarv' ? 'bg-[#3b82f6]' : 
            'bg-[#6366f1]'
        }`}>
            {activeSystem === 'LeadSarv' ? <i className="fas fa-users-rays scale-75"></i> : 
             activeSystem === 'ProjectSarv' ? <i className="fas fa-hard-hat scale-75"></i> : 
             <i className="fas fa-coins scale-75"></i>}
        </div>
        <span className="text-[11px] font-semibold text-[var(--text-primary)] uppercase tracking-tight">
           Realty<span className="font-light opacity-60">Sarv</span>
        </span>
      </div>
    </div>
  );
};

export default SystemSwitcher;
