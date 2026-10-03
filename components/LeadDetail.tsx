
import React from 'react';
import { callNumber, openWhatsApp } from './leadUi';
import { Lead, TaskStatus, TaskPriority, AgreementStatus, BookingStatus, PossessionStatus, LifecycleStage, LeadLifecycleStatus, LeadStatus, User } from '../types';
import Avatar from './Avatar';

interface LeadDetailProps {
  lead: Lead;
  users: User[];
  onAddPropertyImage: (leadId: string, base64Image: string) => void;
  onRemovePropertyImage: (leadId: string, imageId: string) => void;
  onUpdateLeadLifecycle: (leadId: string, stage: LifecycleStage, newStatus: LeadLifecycleStatus) => void;
  onUpdateLeadOwner: (leadId: string, ownerId: string) => void;
  onToggleEditLeadModal: (lead: Lead) => void;
}

const LifecycleStatusItem: React.FC<{
  icon: string;
  label: string;
  value: string;
  colorClass: string;
  description: React.ReactNode;
}> = ({ icon, label, value, colorClass, description }) => (
  <div className="bg-[var(--dark-bg)] p-3 rounded-lg flex items-start gap-3 border border-[var(--border-color)]">
    <div className={`w-8 h-8 flex-shrink-0 rounded flex items-center justify-center text-sm ${colorClass} shadow-sm`}>
      <i className={icon}></i>
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5">
        <h4 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-tight">{label}</h4>
        <div className="relative group">
          <i className="fas fa-info-circle text-[9px] text-[var(--text-secondary)] cursor-pointer"></i>
          <div className="absolute bottom-full mb-2 w-56 p-2 bg-[var(--light-bg)] text-[10px] text-white rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none -translate-x-1/2 left-1/2 border border-white/10">
            {description}
          </div>
        </div>
      </div>
      <p className="text-[13px] font-bold text-[var(--text-primary)] truncate mt-0.5">{value}</p>
    </div>
  </div>
);

const LeadScoreGauge: React.FC<{ score: number }> = ({ score }) => {
    const radius = 32;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    
    let color = 'text-red-500';
    let text = 'Cold';
    if (score >= 70) { color = 'text-green-500'; text = 'Hot'; }
    else if (score >= 40) { color = 'text-yellow-500'; text = 'Warm'; }

    return (
        <div className="relative flex flex-col items-center">
             <div className="relative w-20 h-20">
                 <svg className="w-full h-full transform -rotate-90">
                     <circle className="text-[var(--light-bg)]" strokeWidth="6" stroke="currentColor" fill="transparent" r={radius} cx="40" cy="40" />
                     <circle className={`${color} transition-all duration-1000 ease-out`} strokeWidth="6" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" stroke="currentColor" fill="transparent" r={radius} cx="40" cy="40" />
                 </svg>
                 <div className="absolute inset-0 flex items-center justify-center flex-col">
                     <span className={`text-xl font-bold ${color}`}>{score}</span>
                 </div>
             </div>
             <span className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${color}`}>{text}</span>
        </div>
    );
};

const LeadDetail: React.FC<LeadDetailProps> = ({ lead, users, onAddPropertyImage, onRemovePropertyImage, onUpdateLeadLifecycle, onUpdateLeadOwner, onToggleEditLeadModal }) => {
  if (!lead) return <div className="p-10 text-center opacity-50">No lead selected.</div>;

  const leadScore = React.useMemo(() => {
      let score = 20; 
      if (lead.email) score += 10;
      if (lead.phone) score += 10;
      if (lead.budget) score += 10;
      if (lead.leadStatus === 'Qualified') score += 20;
      if (lead.leadStatus === 'Converted') score = 100;
      if ((lead.siteVisits || []).length > 0) score += 15;
      return Math.min(score, 100);
  }, [lead]);
  
  const nextAction = leadScore > 80 ? "Close deal." : leadScore > 60 ? "Site visit." : "Qualify.";

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-600';
      case 'Contacted': return 'bg-yellow-600';
      case 'Qualified': return 'bg-purple-600';
      case 'Converted': return 'bg-[#00a884]';
      case 'Unqualified': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-[var(--dark-bg)] space-y-6 custom-scrollbar">
      {/* Profile Card */}
      <div className="bg-[var(--medium-bg)] p-5 rounded-2xl border border-[var(--border-color)] shadow-sm">
          <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex flex-col items-center md:w-1/3 md:border-r border-[var(--border-color)] md:pr-6 pb-6 md:pb-0">
                <Avatar initials={lead.avatarInitials} size="lg" chatStatus={lead.chatStatus} />
                <h2 className="text-xl font-bold mt-3 text-[var(--text-primary)] flex items-center gap-2 group">
                    {lead.name}
                    <button onClick={() => onToggleEditLeadModal(lead)} className="text-gray-400 hover:text-[var(--primary-color)] transition-colors opacity-0 group-hover:opacity-100"><i className="fas fa-pencil-alt text-xs"></i></button>
                </h2>
                <div className="relative mt-3 w-full max-w-[140px]">
                    <select
                        value={lead.leadStatus}
                        onChange={(e) => onUpdateLeadLifecycle(lead.id, 'leadStatus', e.target.value as LeadStatus)}
                        className={`w-full py-1.5 rounded-full text-[10px] font-bold uppercase text-white ${getStatusColor(lead.leadStatus)} appearance-none text-center cursor-pointer pr-6 shadow-sm`}
                        style={{ WebkitAppearance: 'none' }}
                    >
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Qualified">Qualified</option>
                        <option value="Unqualified">Unqualified</option>
                        <option value="Converted">Converted</option>
                    </select>
                    <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-[8px] text-white pointer-events-none"></i>
                </div>
              </div>

              <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-3">
                      <h3 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Essentials</h3>
                      <div className="flex items-center gap-3 text-xs text-[var(--text-primary)]"><i className="fas fa-envelope w-4 text-[var(--primary-color)]"></i> {lead.email}</div>
                      <div className="flex items-center gap-3 text-xs text-[var(--text-primary)]">
                        <i className="fas fa-phone w-4 text-[var(--primary-color)]" aria-hidden="true"></i>
                        {lead.phone ? (
                          <span className="flex items-center gap-2">
                            <button type="button" onClick={() => callNumber(lead.phone)} className="px-2 py-0.5 rounded bg-[var(--primary-color)] text-white font-semibold hover:opacity-90">Call</button>
                            <button type="button" onClick={() => openWhatsApp(lead.phone)} className="px-2 py-0.5 rounded border border-[var(--border-color)] font-semibold hover:bg-[var(--light-bg)]">WhatsApp</button>
                          </span>
                        ) : <span className="text-[var(--text-secondary)]">No number saved</span>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[var(--text-primary)]">
                        <i className="fas fa-user-tag w-4 text-[var(--primary-color)]"></i>
                        <select value={lead.ownerId} onChange={(e) => onUpdateLeadOwner(lead.id, e.target.value)} className="bg-transparent text-xs border-none p-0 focus:ring-0 cursor-pointer text-blue-500 font-bold hover:underline">
                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                      </div>
                  </div>
                  
                  <div className="bg-[var(--dark-bg)] p-4 rounded-xl border border-[var(--border-color)] flex items-center justify-around">
                      <LeadScoreGauge score={leadScore} />
                      <div className="text-center">
                          <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase">Recommendation</p>
                          <p className="text-xs font-bold text-[var(--text-primary)] mt-1">{nextAction}</p>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* Lifecycle Grid */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider px-1">Pipeline Tracking</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <LifecycleStatusItem icon="fas fa-building" label="Project" value={lead.leadProject} colorClass="bg-blue-600/10 text-blue-500" description="The target development." />
          <LifecycleStatusItem icon="fas fa-map-marked-alt" label="Site Visit" value={(lead.siteVisits || []).length > 0 ? lead.siteVisits![lead.siteVisits!.length-1].status : 'None'} colorClass="bg-indigo-600/10 text-indigo-500" description="Last visit status." />
          <LifecycleStatusItem icon="fas fa-file-signature" label="Booking" value={lead.bookingStatus} colorClass="bg-green-600/10 text-green-500" description="Financial commitment status." />
          <LifecycleStatusItem icon="fas fa-file-contract" label="Agreement" value={lead.agreementStatus} colorClass="bg-purple-600/10 text-purple-500" description="Legal documentation stage." />
          <LifecycleStatusItem icon="fas fa-key" label="Possession" value={lead.possessionStatus} colorClass="bg-orange-600/10 text-orange-500" description="Handover readiness." />
          <LifecycleStatusItem icon="fas fa-bullhorn" label="Inquiry Source" value={lead.leadSource} colorClass="bg-gray-600/10 text-gray-500" description="Lead channel." />
        </div>
      </div>

      {/* Images & Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[var(--medium-bg)] p-5 rounded-2xl border border-[var(--border-color)]">
            <h3 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Property Assets</h3>
            <div className="grid grid-cols-2 gap-3">
                <label className="border-2 border-dashed border-[var(--border-color)] rounded-xl flex flex-col items-center justify-center p-4 cursor-pointer hover:border-[var(--primary-color)] transition-all">
                    <i className="fas fa-plus text-[var(--primary-color)] text-lg mb-1"></i>
                    <span className="text-[10px] font-bold text-gray-400">UPLOAD</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            const reader = new FileReader();
                            reader.onload = (re) => onAddPropertyImage(lead.id, re.target?.result as string);
                            reader.readAsDataURL(file);
                        }
                    }} />
                </label>
                {lead.propertyImages.slice(0, 3).map(img => (
                    <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden border border-[var(--border-color)] shadow-sm">
                        <img src={img.url} alt="Property" className="w-full h-full object-cover" />
                        <button onClick={() => onRemovePropertyImage(lead.id, img.id)} className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-600/80 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-all"><i className="fas fa-times"></i></button>
                    </div>
                ))}
            </div>
          </div>

          <div className="bg-[var(--medium-bg)] p-5 rounded-2xl border border-[var(--border-color)]">
            <h3 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Qualification Summary</h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div>
                    <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-tight">Budget Range</p>
                    <p className="text-xs font-bold text-[var(--text-primary)] mt-1">{lead.budget || 'Unset'}</p>
                </div>
                <div>
                    <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-tight">Preferred Spot</p>
                    <p className="text-xs font-bold text-[var(--text-primary)] mt-1">{lead.preferredLocation || 'Unset'}</p>
                </div>
                <div className="col-span-2">
                    <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-tight">Interest Profiles</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {lead.initialInterest.map(i => <span key={i} className="px-2 py-0.5 rounded-full bg-[var(--light-bg)] border border-[var(--border-color)] text-[10px] font-bold text-[var(--text-secondary)]">{i}</span>)}
                        {lead.initialInterest.length === 0 && <span className="text-[10px] italic text-gray-500">Not specified</span>}
                    </div>
                </div>
            </div>
          </div>
      </div>
    </div>
  );
};

export default LeadDetail;
