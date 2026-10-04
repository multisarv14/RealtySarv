
import React from 'react';
import { toast } from './ui/Toast';
import { Lead, Project, CustomerDocument, Applicant, LifecycleStage, LeadLifecycleStatus } from '../types';
import DocumentPreviewModal from './modals/DocumentPreviewModal';
import { Modal, Button } from './ui/Modal';
import UnitDocumentViewerModal, { UnitDocTemplate } from './modals/UnitDocumentViewerModal';

interface DocumentHubProps {
  lead: Lead;
  project: Project | null;
  onUpdateApplicantDocument: (leadId: string, applicantId: string, docType: string, newDoc: CustomerDocument) => void;
  onUpdateLeadLifecycle?: (leadId: string, stage: LifecycleStage, newStatus: LeadLifecycleStatus) => void;
  onUpdateCustomData?: (leadId: string, data: Record<string, any>) => void;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

type DocHubTab = 'Customer KYC' | 'Unit Documents' | 'Project Documents';

const sentence = (s: string) => ({ 'View File': 'View', 'View Document': 'View', 'Upload Final Copy': 'Upload final copy', 'Pending Verify': 'Waiting for verification', 'Upload Challan': 'Upload challan', 'Mark Registered': 'Mark registered', 'ATS Lineup': 'ATS lineup' } as Record<string, string>)[s] || s;

const DocumentRow: React.FC<{ 
    name: string; 
    icon: string; 
    description: string; 
    onView: () => void;
    onUpload?: () => void;
    onVerify?: () => void;
    onReject?: () => void;
    step: number;
    actionLabel?: string;
    isLocked?: boolean;
    isPrimaryAction?: boolean;
    docStatus?: CustomerDocument['status'];
    fileName?: string;
    onViewClickOverride?: () => void;
    /** Shown instead of a button when there is nothing to open (for example, a project paper that has not been added). */
    emptyLabel?: string;
}> = ({ 
    name, icon, description, onView, onUpload, onVerify, onReject, step, 
    actionLabel = "View File", isLocked = false, isPrimaryAction = false, 
    docStatus = 'Pending', fileName,
    onViewClickOverride, emptyLabel
}) => {
    const btn = 'h-8 px-3 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap';
    const ghost = `${btn} border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--light-bg)]`;
    const label = sentence(actionLabel);
    const open = () => (onViewClickOverride ? onViewClickOverride() : onView());
    const chip = isLocked ? { t: 'Locked', c: 'bg-gray-500/10 text-[var(--text-secondary)] ring-gray-500/30' }
        : docStatus === 'Verified' ? { t: 'Verified', c: 'bg-green-500/10 text-green-500 ring-green-500/30' }
        : docStatus === 'Uploaded' ? { t: 'Uploaded', c: 'bg-blue-500/10 text-blue-500 ring-blue-500/30' }
        : docStatus === 'Rejected' ? { t: 'Rejected', c: 'bg-red-500/10 text-red-500 ring-red-500/30' }
        : emptyLabel ? { t: emptyLabel, c: 'bg-gray-500/10 text-[var(--text-secondary)] ring-gray-500/30' } : null;
    return (
    <li className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${isLocked ? 'opacity-50' : 'hover:bg-[var(--dark-bg)]'}`}>
        <span className="w-6 h-6 shrink-0 rounded-full bg-[var(--light-bg)] text-[var(--text-secondary)] text-[11px] font-bold flex items-center justify-center" aria-hidden="true">{step}</span>
        <span className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg bg-[var(--medium-bg)] text-[var(--primary-color)] text-sm" aria-hidden="true"><i className={icon}></i></span>
        <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-[var(--text-primary)] text-sm truncate">{name}</h4>
            <p className="text-xs text-[var(--text-secondary)] truncate">{fileName || description}</p>
        </div>
        {chip && <span className={`hidden sm:inline-block px-2 py-0.5 text-[11px] rounded-full font-semibold ring-1 ring-inset ${chip.c}`}>{chip.t}</span>}
        <div className="shrink-0 flex gap-1.5">
            {isLocked ? null : docStatus === 'Uploaded' && onVerify ? (
                <>
                    <button onClick={onVerify} className={`${btn} bg-green-600 border-transparent text-white hover:bg-green-700`}>Verify</button>
                    <button onClick={() => onReject && onReject()} className={`${btn} border-red-500/50 text-red-500 hover:bg-red-500/10`}>Reject</button>
                </>
            ) : docStatus === 'Verified' ? (
                <button onClick={open} className={ghost}>{label}</button>
            ) : (docStatus === 'Pending' || docStatus === 'Rejected') && onUpload ? (
                <button onClick={onUpload} className={isPrimaryAction ? `${btn} bg-[var(--primary-color)] border-transparent text-white hover:brightness-110` : ghost}>{label}</button>
            ) : !onUpload && !emptyLabel ? (
                <button onClick={open} className={ghost}>{label}</button>
            ) : null}
        </div>
    </li>
    );
};

const CustomerDocumentsTab: React.FC<{ lead: Lead; onUpdate: DocumentHubProps['onUpdateApplicantDocument']; }> = ({ lead, onUpdate }) => {
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);
    const [docToUpload, setDocToUpload] = React.useState<{applicantId: string, docType: string} | null>(null);
    const [previewingDoc, setPreviewingDoc] = React.useState<{ docName: string; fileName: string; fileUrl: string; } | null>(null);

    const applicants: Applicant[] = lead.bookingDetails ? [lead.bookingDetails.primaryApplicant, ...lead.bookingDetails.coApplicants] : [];
    const [activeApplicantId, setActiveApplicantId] = React.useState<string | null>(applicants[0]?.id || null);

    const activeApplicant = applicants.find(app => app.id === activeApplicantId);

    const requiredDocs = ['PAN Card', 'Aadhaar Card', 'Address Proof', 'Passport Size Photo', 'Bank Statement', 'ITR / Salary Slip'];

    const getStatusInfo = (status: CustomerDocument['status']) => {
        switch (status) {
            case 'Pending': return { chip: 'bg-gray-600/50 text-gray-200 ring-gray-500/30', icon: 'fas fa-clock', iconColor: 'text-gray-400' };
            case 'Uploaded': return { chip: 'bg-blue-600/30 text-blue-200 ring-blue-500/40', icon: 'fas fa-cloud-upload-alt', iconColor: 'text-blue-400' };
            case 'Verified': return { chip: 'bg-green-600/30 text-green-200 ring-green-500/40', icon: 'fas fa-check-circle', iconColor: 'text-green-400' };
            case 'Rejected': return { chip: 'bg-red-600/30 text-red-200 ring-red-500/40', icon: 'fas fa-times-circle', iconColor: 'text-red-400' };
            default: return { chip: 'bg-gray-600/20 text-gray-300 ring-gray-500/30', icon: 'fas fa-question-circle', iconColor: 'text-gray-400' };
        }
    };

    const handleUploadClick = (applicantId: string, docType: string) => {
        setDocToUpload({applicantId, docType});
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0] && docToUpload) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                const fileUrl = e.target?.result as string;
                onUpdate(lead.id, docToUpload.applicantId, docToUpload.docType, {
                    status: 'Uploaded',
                    fileName: file.name,
                    fileUrl: fileUrl,
                });
            };
            reader.readAsDataURL(file);
        }
        if(fileInputRef.current) fileInputRef.current.value = "";
        setDocToUpload(null);
    };

    const handleVerify = (applicantId: string, docType: string) => {
        const currentDoc = applicants.find(a => a.id === applicantId)?.customerDocuments?.[docType];
        if (currentDoc) {
            onUpdate(lead.id, applicantId, docType, { ...currentDoc, status: 'Verified' });
        }
    };

    const handleReject = (applicantId: string, docType: string) => {
        const currentDoc = applicants.find(a => a.id === applicantId)?.customerDocuments?.[docType];
        if (currentDoc) {
            onUpdate(lead.id, applicantId, docType, { ...currentDoc, status: 'Rejected' });
        }
    };
    
    const handlePreview = (docName: string, doc: CustomerDocument) => {
        if (doc.fileName && doc.fileUrl) {
            setPreviewingDoc({ docName, fileName: doc.fileName, fileUrl: doc.fileUrl });
        } else {
            toast.info("Upload the file first, then you can preview it.");
        }
    };

    if (!lead.bookingDetails) {
      return (
        <div className="p-8 text-center text-[var(--text-secondary)] flex flex-col items-center justify-center h-full">
            <i className="fas fa-file-alt text-4xl mb-4"></i>
            <h4 className="font-semibold text-[var(--text-primary)]">KYC documents can be managed after booking.</h4>
            <p className="text-sm mt-1 max-w-xs">Once a booking is created, you can manage documents for all applicants here.</p>
        </div>
      );
    }
    
    // FIX: Explicitly cast customerDocuments to Record<string, CustomerDocument> to avoid 'unknown' type errors (Line 147 of first CustomerDocumentsTab).
    const verifiedCount = activeApplicant ? requiredDocs.filter(docType => (activeApplicant.customerDocuments as Record<string, CustomerDocument>)?.[docType]?.status === 'Verified').length : 0;
    const progress = activeApplicant ? (verifiedCount / requiredDocs.length) * 100 : 0;
    
    return (
        <div className="p-4 sm:p-6 max-w-4xl mx-auto" data-testid="kyc-documents">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

            {applicants.length > 1 && (
                <div role="tablist" aria-label="Applicants" className="flex gap-1.5 mb-4 overflow-x-auto no-scrollbar">
                    {applicants.map((app, index) => (
                        <button key={app.id} role="tab" aria-selected={app.id === activeApplicantId} onClick={() => setActiveApplicantId(app.id)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors ${app.id === activeApplicantId ? 'border-[var(--primary-color)] text-[var(--primary-color)] bg-[color-mix(in_srgb,var(--primary-color)_12%,transparent)]' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
                            {index === 0 ? 'Primary applicant' : `Co-applicant ${index}`}
                        </button>
                    ))}
                </div>
            )}

            {activeApplicant && (
                <div className="animate-fadeIn space-y-3">
                    <div className="bg-[var(--dark-bg)] rounded-xl border border-[var(--light-bg)] p-4">
                        <div className="flex justify-between items-center mb-2 gap-3">
                            <div className="min-w-0">
                                <h4 className="font-semibold text-sm text-[var(--text-primary)] truncate">{activeApplicant.fullName}</h4>
                                <p className="text-xs text-[var(--text-secondary)]">{applicants.indexOf(activeApplicant) === 0 ? 'Primary applicant' : `Co-applicant ${applicants.indexOf(activeApplicant)}`} · KYC documents</p>
                            </div>
                            <span className={`shrink-0 text-xs font-bold ${verifiedCount === requiredDocs.length ? 'text-green-500' : 'text-[var(--text-primary)]'}`}>{verifiedCount} of {requiredDocs.length} verified</span>
                        </div>
                        <div className="w-full bg-[var(--light-bg)] rounded-full h-1.5" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="KYC verified">
                            <div className={`${verifiedCount === requiredDocs.length ? 'bg-green-500' : 'bg-[var(--primary-color)]'} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>

                    <ul className="border border-[var(--light-bg)] rounded-xl overflow-hidden divide-y divide-[var(--light-bg)]">
                        {requiredDocs.map(docType => {
                            const doc = (activeApplicant.customerDocuments as Record<string, CustomerDocument>)[docType] || { status: 'Pending' };
                            const statusInfo = getStatusInfo(doc.status);
                            const btn = 'h-8 px-3 text-xs rounded-lg font-semibold transition-colors inline-flex items-center gap-1.5';
                            return (
                                <li key={docType} className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[var(--dark-bg)] transition-colors">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <i className={`${statusInfo.icon} ${statusInfo.iconColor} text-base w-5 text-center`} aria-hidden="true"></i>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{docType}</p>
                                            <p className="text-xs text-[var(--text-secondary)] truncate" title={doc.fileName}>{doc.fileName ? <><i className="fas fa-paperclip mr-1" aria-hidden="true"></i>{doc.fileName}</> : 'No file yet'}</p>
                                        </div>
                                        <span className={`px-2 py-0.5 text-[11px] rounded-full font-semibold ring-1 ring-inset ${statusInfo.chip}`}>{doc.status}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-shrink-0 self-end sm:self-center">
                                        {doc.fileName && <button onClick={() => handlePreview(docType, doc)} className={`${btn} border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--light-bg)]`}><i className="far fa-eye" aria-hidden="true"></i>Preview</button>}
                                        {doc.status === 'Uploaded' && (
                                            <>
                                                <button onClick={() => handleVerify(activeApplicant.id, docType)} className={`${btn} bg-green-600 text-white hover:bg-green-700`}>Verify</button>
                                                <button onClick={() => handleReject(activeApplicant.id, docType)} className={`${btn} border border-red-500/50 text-red-500 hover:bg-red-500/10`}>Reject</button>
                                            </>
                                        )}
                                        <button onClick={() => handleUploadClick(activeApplicant.id, docType)} className={`${btn} ${doc.status === 'Pending' || doc.status === 'Rejected' ? 'bg-[var(--primary-color)] text-white hover:brightness-110' : 'border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--light-bg)] hover:text-[var(--text-primary)]'}`}>
                                            <i className="fas fa-upload" aria-hidden="true"></i>{doc.status === 'Pending' || doc.status === 'Rejected' ? 'Upload' : 'Replace'}
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
            
            {previewingDoc && (
                <DocumentPreviewModal 
                    isOpen={!!previewingDoc}
                    onClose={() => setPreviewingDoc(null)}
                    docName={previewingDoc.docName}
                    fileName={previewingDoc.fileName}
                    fileUrl={previewingDoc.fileUrl}
                />
            )}
        </div>
    );
};

const UnitDocumentsTab: React.FC<{ lead: Lead; project: Project | null; onUpdateLifecycle?: DocumentHubProps['onUpdateLeadLifecycle']; onUpdateCustomData?: DocumentHubProps['onUpdateCustomData']; onUpdateUnitDoc: DocumentHubProps['onUpdateApplicantDocument'] }> = ({ lead, project, onUpdateLifecycle, onUpdateCustomData, onUpdateUnitDoc }) => {
    const [viewingTemplate, setViewingTemplate] = React.useState<UnitDocTemplate | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);
    const [docToUploadType, setDocToUploadType] = React.useState<string | null>(null);

    const { agreementStatus, customData = {}, bookingDetails } = lead;
    // FIX: Cast unitDocuments to Record<string, CustomerDocument> to avoid 'unknown' indexing errors.
    const unitDocs = (bookingDetails?.unitDocuments || {}) as Record<string, CustomerDocument>;

    const verifiedKycCount = React.useMemo(() => {
        if (!bookingDetails) return 0;
        // FIX: Cast customerDocuments to Record<string, CustomerDocument> to resolve 'unknown' type error during Object.values filter (Line 220).
        const docs = (bookingDetails.primaryApplicant.customerDocuments || {}) as Record<string, CustomerDocument>;
        return Object.values(docs).filter(d => d.status === 'Verified').length;
    }, [bookingDetails]);

    const handleAction = async (docName: string) => {
        if (docName === 'Agreement Draft') {
            if (agreementStatus === 'Drafted') {
                if (verifiedKycCount < 4) {
                    toast.error("Verify at least 4 KYC documents for the primary applicant first.");
                } else if (!customData.agreementDraftGenerated) {
                    toast.success("Agreement draft is ready. Open it again to view and print.");
                    onUpdateCustomData?.(lead.id, { agreementDraftGenerated: true });
                } else {
                    toast.success("Moved to the Signature stage. Share the draft with the customer yourself; automatic Email/WhatsApp sending isn't set up yet.");
                    onUpdateLifecycle?.(lead.id, 'agreementStatus', 'Signature');
                }
            } else {
                setViewingTemplate('Agreement Draft' as UnitDocTemplate);
            }
        } else if (docName === 'Challan Copy' || docName === 'Registered Agreement') {
             // Logic handled by row buttons
        } else {
            setViewingTemplate(docName as UnitDocTemplate);
        }
    };

    const handleUploadClick = (docType: string) => {
        setDocToUploadType(docType);
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0] && docToUploadType) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                const fileUrl = e.target?.result as string;
                onUpdateUnitDoc(lead.id, 'unit', docToUploadType, {
                    status: 'Uploaded',
                    fileName: file.name,
                    fileUrl: fileUrl,
                });
            };
            reader.readAsDataURL(file);
        }
        if(fileInputRef.current) fileInputRef.current.value = "";
        setDocToUploadType(null);
    };

    const handleVerify = (docType: string) => {
        const currentDoc = unitDocs[docType];
        if (currentDoc) {
            onUpdateUnitDoc(lead.id, 'unit', docType, { ...currentDoc, status: 'Verified' });
            
            // Advance lifecycle to Registered if the final copy is verified
            if (docType === 'Registered Agreement') {
                onUpdateLifecycle?.(lead.id, 'agreementStatus', 'Registered');
            }
        }
    };

    const [confirmAts, setConfirmAts] = React.useState(false);
    const handleScheduleATS = () => setConfirmAts(true);

    const handleAtsLineup = () => {
        toast.info("Use the “ATS Lineup” button on this lead in the Agreement list to add the appointment.");
    };

    const handleMarkRegistered = () => {
         toast.info("Use the “Mark Registered” button on this lead in the Agreement list to add the registration details.");
    };

    const getAgreementActionLabel = () => {
        if (agreementStatus === 'Drafted') {
            if (verifiedKycCount < 4) return `Complete KYC (${verifiedKycCount}/4 Verified)`;
            return customData.agreementDraftGenerated ? 'Send for Signature' : 'Generate Draft';
        }
        const draftDoc = unitDocs['Agreement Draft'];
        if (agreementStatus === 'Signature') {
            if (draftDoc?.status === 'Verified') return 'Schedule ATS';
            if (draftDoc?.status === 'Uploaded') return 'Pending Verification';
            return 'Upload Signed Draft';
        }
        return 'View Document';
    };

    const isSignedVerified = unitDocs['Agreement Draft']?.status === 'Verified';
    const isChallanVerified = unitDocs['Challan Copy']?.status === 'Verified';
    const isRegisteredVerified = unitDocs['Registered Agreement']?.status === 'Verified';

    const documents: { 
        name: UnitDocTemplate; 
        icon: string; 
        description: string; 
        actionLabel?: string; 
        isPrimary?: boolean; 
        isLocked?: boolean;
        hasUpload?: boolean;
    }[] = [
        { name: 'Booking Form', icon: 'fas fa-pen-to-square', description: 'Primary application form signed by the customer.' },
        { name: 'Allotment Letter', icon: 'fas fa-envelope-open-text', description: 'Official confirmation of unit allocation.' },
        { 
            name: 'Agreement Draft', 
            icon: 'fas fa-file-signature', 
            description: 'Legal draft of the main sale agreement for review.', 
            actionLabel: getAgreementActionLabel(),
            isPrimary: agreementStatus === 'Drafted' || (agreementStatus === 'Signature' && !isSignedVerified),
            hasUpload: agreementStatus === 'Signature'
        },
        { 
            name: 'Challan Copy', 
            icon: 'fas fa-receipt', 
            description: 'Government challan receipt for stamp duty and registration fees.', 
            actionLabel: isChallanVerified ? (customData.isLineupDone ? 'Mark Registered' : 'ATS Lineup') : 'Upload Challan',
            isPrimary: agreementStatus === 'ATS' && !customData.isLineupDone,
            isLocked: agreementStatus !== 'ATS' && agreementStatus !== 'Registered',
            hasUpload: agreementStatus === 'ATS' || agreementStatus === 'Registered'
        },
        { 
            name: 'Registered Agreement', 
            icon: 'fas fa-stamp', 
            description: 'The legally registered copy of the Sale Deed.', 
            actionLabel: isRegisteredVerified ? 'View Document' : (unitDocs['Registered Agreement']?.status === 'Uploaded' ? 'Pending Verify' : 'Upload Final Copy'),
            isPrimary: customData.isExecutionDone && !isRegisteredVerified,
            isLocked: !customData.isExecutionDone && agreementStatus !== 'Registered',
            hasUpload: customData.isExecutionDone || agreementStatus === 'Registered'
        },
        { name: 'Tripartite Agreement', icon: 'fas fa-handshake', description: 'Multi-party agreement for bank home loans.' },
        { name: 'Maintenance Agreement', icon: 'fas fa-tools', description: 'Contract for facility and society management.' },
        { name: 'Unit Layout Plan', icon: 'fas fa-drafting-compass', description: 'Architectural dimension plan of the specific unit.' },
        { name: 'Flat NOC', icon: 'fas fa-check-double', description: 'No Objection Certificate for the unit.' },
        { name: 'Handover Checklist', icon: 'fas fa-list-check', description: 'Technical inspection report and snag list.' },
        { name: 'Possession Letter', icon: 'fas fa-key', description: 'The official document for physical key handover.' },
        { name: 'Possession Receipt', icon: 'fas fa-receipt', description: 'Confirmation of payment for possession charges.' },
        { name: 'Share Certificate', icon: 'fas fa-certificate', description: 'Proof of society/association membership.' },
    ];
    
    if (lead.bookingStatus !== 'Booked') {
        return (
             <div className="p-8 text-center text-[var(--text-secondary)] flex flex-col items-center justify-center h-full">
                <i className="fas fa-lock text-4xl mb-4"></i>
                <h4 className="font-semibold text-[var(--text-primary)]">Unit Lifecycle is Locked</h4>
                <p className="text-sm mt-1 max-w-xs">These documents generate automatically in sequence once the booking is confirmed.</p>
            </div>
        )
    }

    return (
        <div className="p-4 sm:p-6 max-w-4xl mx-auto">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-semibold text-[var(--text-primary)]">Unit documents <span className="font-normal text-[var(--text-secondary)]">· in the order they happen</span></h4>
                <span className="text-xs font-semibold text-green-500"><i className="fas fa-check-circle mr-1" aria-hidden="true"></i>Booking confirmed</span>
            </div>
            <ul data-testid="unit-documents" className="border border-[var(--light-bg)] rounded-xl overflow-hidden divide-y divide-[var(--light-bg)]">
                {documents.map((doc, idx) => {
                    const statusObj = unitDocs[doc.name];
                    const currentStatus = statusObj?.status || 'Pending';
                    const isScheduleAtsBtn = doc.name === 'Agreement Draft' && agreementStatus === 'Signature' && currentStatus === 'Verified';
                    
                    const isLineupBtn = doc.name === 'Challan Copy' && agreementStatus === 'ATS' && currentStatus === 'Verified' && !customData.isLineupDone;
                    const isMarkRegBtn = doc.name === 'Challan Copy' && agreementStatus === 'ATS' && currentStatus === 'Verified' && customData.isLineupDone;

                    return (
                        <DocumentRow 
                            key={doc.name}
                            name={doc.name}
                            icon={doc.icon}
                            description={doc.description}
                            step={idx + 1}
                            docStatus={currentStatus}
                            fileName={statusObj?.fileName}
                            onView={() => handleAction(doc.name)}
                            onUpload={doc.hasUpload ? () => handleUploadClick(doc.name) : undefined}
                            onVerify={doc.hasUpload ? () => handleVerify(doc.name) : undefined}
                            isPrimaryAction={doc.isPrimary}
                            actionLabel={isScheduleAtsBtn ? 'Schedule ATS' : isLineupBtn ? 'ATS Lineup' : isMarkRegBtn ? 'Mark Registered' : doc.actionLabel}
                            onViewClickOverride={isScheduleAtsBtn ? handleScheduleATS : isLineupBtn ? handleAtsLineup : isMarkRegBtn ? handleMarkRegistered : undefined}
                        />
                    );
                })}
            </ul>
            <Modal isOpen={confirmAts} onClose={() => setConfirmAts(false)} size="sm" title="Move to ATS stage?" subtitle={lead.name}
                footer={<><Button type="button" tone="ghost" onClick={() => setConfirmAts(false)}>Not yet</Button><Button type="button" onClick={() => { setConfirmAts(false); onUpdateLifecycle?.(lead.id, 'agreementStatus', 'ATS'); }}>Move to ATS</Button></>}>
                <p className="text-sm text-[var(--text-secondary)]">The signed agreement has been verified. Move this booking to the ATS (Agreement to Sell) stage?</p>
            </Modal>
            {viewingTemplate && (
                <UnitDocumentViewerModal
                    isOpen={!!viewingTemplate}
                    onClose={() => setViewingTemplate(null)}
                    templateType={viewingTemplate}
                    lead={lead}
                    project={project}
                />
            )}
        </div>
    );
};

const ProjectDocumentsTab: React.FC<{ project: Project | null }> = ({ project }) => {
    const [preview, setPreview] = React.useState<{ docName: string; fileName: string; fileUrl: string } | null>(null);

    if (!project) {
        return (
             <div className="p-8 text-center text-[var(--text-secondary)] flex flex-col items-center justify-center h-full">
                <i className="fas fa-folder-minus text-4xl mb-4" aria-hidden="true"></i>
                <h4 className="font-semibold text-[var(--text-primary)]">No project assigned</h4>
                <p className="text-sm mt-1 max-w-xs">This lead is not yet assigned to a project. Project documents will appear here once assigned.</p>
            </div>
        )
    }

    // Only what the project really has is openable; the rest says so instead of offering a button that does nothing.
    const documents = [
        { name: 'Project brochure', icon: 'fas fa-book-open', description: 'Marketing material with project details and images.' },
        { name: 'RERA certificate', icon: 'fas fa-certificate', description: project.reraNumber ? `RERA number ${project.reraNumber}` : 'Official RERA registration certificate.' },
        { name: 'Floor plans', icon: 'fas fa-ruler-combined', description: 'Architectural drawings of the unit layouts.', file: project.floorPlanUrl ? { fileName: `${project.name} floor plan`, fileUrl: project.floorPlanUrl } : undefined },
        { name: 'Legal title report', icon: 'fas fa-gavel', description: 'Report verifying the legal ownership of the land.' },
        { name: 'Commencement certificate', icon: 'fas fa-hard-hat', description: 'Approval from authorities to begin construction.' },
    ];

    return (
        <div className="p-4 sm:p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-semibold text-[var(--text-primary)]">Project documents</h4>
                <span className="text-xs font-semibold text-[var(--primary-color)]">{project.name}</span>
            </div>
            <ul data-testid="project-documents" className="border border-[var(--light-bg)] rounded-xl overflow-hidden divide-y divide-[var(--light-bg)]">
                {documents.map((doc, idx) => (
                    <DocumentRow
                        key={doc.name}
                        name={doc.name}
                        icon={doc.icon}
                        description={doc.description}
                        step={idx + 1}
                        docStatus={doc.file ? 'Verified' : 'Pending'}
                        emptyLabel={doc.file ? undefined : 'Not added'}
                        actionLabel="View File"
                        onView={() => doc.file && setPreview({ docName: doc.name, ...doc.file })}
                    />
                ))}
            </ul>
            <p className="mt-3 text-xs text-[var(--text-secondary)]">Project papers are added by an Admin under Projects. The floor plan comes from the project's Floor Plan tab.</p>
            {preview && <DocumentPreviewModal isOpen={!!preview} onClose={() => setPreview(null)} docName={preview.docName} fileName={preview.fileName} fileUrl={preview.fileUrl} />}
        </div>
    );
};

const DocumentHub: React.FC<DocumentHubProps> = ({ lead, project, onUpdateApplicantDocument, onUpdateLeadLifecycle, onUpdateCustomData, activeTab, setActiveTab }) => {
  const tabs: { key: DocHubTab; label: string; icon: string }[] = [
    { key: 'Customer KYC', label: 'Customer KYC', icon: 'fas fa-id-card' },
    { key: 'Unit Documents', label: 'Unit Documents', icon: 'fas fa-file-contract' },
    { key: 'Project Documents', label: 'Project Documents', icon: 'fas fa-building-flag' },
  ];

  // Customer KYC and Unit documents belong to a booking: before it, the lead only has the project's documents.
  const booked = lead.bookingStatus === 'Booked' && !!lead.bookingDetails;
  const visibleTabs = booked ? tabs : tabs.filter(t => t.key === 'Project Documents');
  const currentTab: DocHubTab = booked ? ((activeTab as DocHubTab) || 'Customer KYC') : 'Project Documents';

  const renderContent = () => {
    switch (currentTab) {
        case 'Customer KYC':
            return <CustomerDocumentsTab lead={lead} onUpdate={onUpdateApplicantDocument} />;
        case 'Unit Documents':
            return <UnitDocumentsTab lead={lead} project={project} onUpdateLifecycle={onUpdateLeadLifecycle} onUpdateCustomData={onUpdateCustomData} onUpdateUnitDoc={onUpdateApplicantDocument} />;
        case 'Project Documents':
            return <ProjectDocumentsTab project={project} />;
        default:
            return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[var(--medium-bg)]">
        <div role="tablist" className="flex items-center gap-1.5 px-4 py-2.5 md:py-0 md:h-[52px] border-b border-[var(--light-bg)] flex-shrink-0 bg-[var(--dark-bg)] overflow-x-auto no-scrollbar">
            {visibleTabs.map(tab => (
                <button key={tab.key} role="tab" aria-selected={currentTab === tab.key} onClick={() => setActiveTab?.(tab.key)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${currentTab === tab.key ? 'bg-[var(--primary-color)] text-white shadow-sm' : 'bg-[var(--medium-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--light-bg)]'}`}>
                    <i className={tab.icon} aria-hidden="true"></i>
                    <span>{tab.label.replace('Documents', 'documents')}</span>
                </button>
            ))}
        </div>
        <div className="flex-1 overflow-y-auto">
            {renderContent()}
        </div>
    </div>
  );
};

export default DocumentHub;
