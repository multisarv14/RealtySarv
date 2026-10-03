
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
}> = ({ 
    name, icon, description, onView, onUpload, onVerify, onReject, step, 
    actionLabel = "View File", isLocked = false, isPrimaryAction = false, 
    docStatus = 'Pending', fileName,
    onViewClickOverride
}) => (
    <div 
        onClick={() => !isLocked && (onViewClickOverride ? onViewClickOverride() : (docStatus === 'Verified' || !onUpload ? onView() : onUpload()))}
        className={`bg-[var(--dark-bg)] p-3 rounded-lg border flex items-center gap-4 group transition-all mb-2 ${isLocked ? 'opacity-40 cursor-not-allowed border-[var(--light-bg)]' : 'border-[var(--light-bg)] hover:border-[var(--primary-color)] cursor-pointer shadow-sm'}`}
    >
        <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded bg-[var(--medium-bg)] text-[var(--text-secondary)] text-xs font-semibold border border-[var(--light-bg)] group-hover:bg-[var(--primary-color)] group-hover:text-white transition-colors">
            {step}
        </div>
        <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded bg-[var(--medium-bg)] text-[var(--primary-color)] text-lg border border-[var(--light-bg)]">
            <i className={icon}></i>
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
                <h4 className="font-bold text-[var(--text-primary)] text-sm">{name}</h4>
                {isLocked && <i className="fas fa-lock text-[10px] text-[var(--text-secondary)]"></i>}
                {docStatus === 'Verified' && <i className="fas fa-check-circle text-green-500 text-xs"></i>}
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 line-clamp-1">{fileName || description}</p>
        </div>
        <div className="flex-shrink-0 flex gap-2">
            {docStatus === 'Uploaded' && onVerify && (
                <>
                    <button onClick={(e) => { e.stopPropagation(); onVerify(); }} className="px-3 py-1.5 rounded text-[10px] font-semibold uppercase bg-green-600/10 text-green-500 border border-green-500/20 hover:bg-green-600 hover:text-white transition-all">Verify</button>
                    <button onClick={(e) => { e.stopPropagation(); onReject && onReject(); }} className="px-3 py-1.5 rounded text-[10px] font-semibold uppercase bg-red-600/10 text-red-500 border border-red-500/20 hover:bg-red-600 hover:text-white transition-all">Reject</button>
                </>
            )}
            
            {docStatus === 'Verified' && (
                <button onClick={(e) => { e.stopPropagation(); onViewClickOverride ? onViewClickOverride() : onView(); }} className="px-3 py-1.5 rounded text-[10px] font-semibold uppercase bg-gray-600/10 text-gray-400 border border-gray-500/20 hover:bg-gray-600 hover:text-white transition-all">View</button>
            )}

            {(docStatus === 'Pending' || docStatus === 'Rejected') && onUpload && (
                 <button
                    onClick={(e) => { e.stopPropagation(); onUpload(); }}
                    disabled={isLocked}
                    className={`px-3 py-1.5 rounded text-[10px] font-semibold uppercase border transition-all ${
                        isLocked 
                        ? 'bg-transparent text-[var(--text-secondary)] border-transparent' 
                        : isPrimaryAction
                            ? 'bg-blue-600/10 text-blue-500 border-blue-500/20 hover:bg-blue-600 hover:text-white'
                            : 'bg-[var(--medium-bg)] text-[var(--text-secondary)] hover:bg-[var(--primary-color)] hover:text-white border border-[var(--light-bg)] group-hover:border-[var(--primary-color)]'
                    }`}
                >
                    {actionLabel}
                </button>
            )}
            
            {!onUpload && (
                <button
                    onClick={(e) => { e.stopPropagation(); onViewClickOverride ? onViewClickOverride() : onView(); }}
                    disabled={isLocked}
                    className="px-3 py-1.5 rounded text-[10px] font-semibold uppercase bg-[var(--medium-bg)] text-[var(--text-secondary)] hover:bg-[var(--primary-color)] hover:text-white border border-[var(--light-bg)] group-hover:border-[var(--primary-color)]"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    </div>
);

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
        <div className="p-4 sm:p-6">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            
            <div className="flex border-b border-[var(--light-bg)] mb-6">
                {applicants.map((app, index) => (
                    <button 
                        key={app.id} 
                        onClick={() => setActiveApplicantId(app.id)}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${app.id === activeApplicantId ? 'border-b-2 border-[var(--primary-color)] text-[var(--primary-color)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    >
                        {index === 0 ? 'Primary Applicant' : `Co-Applicant ${index}`}
                    </button>
                ))}
            </div>

            {activeApplicant && (
                <div className="animate-fadeIn">
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold text-[var(--text-primary)]">KYC Completion for {activeApplicant.fullName}</h4>
                            <span className="text-sm font-bold text-[var(--primary-color)]">{verifiedCount} / {requiredDocs.length} Verified</span>
                        </div>
                        <div className="w-full bg-[var(--dark-bg)] rounded-full h-2.5">
                            <div className="bg-[var(--primary-color)] h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>

                    <ul className="space-y-3">
                        {requiredDocs.map(docType => {
                            // FIX: Explicit cast of customerDocuments ensures doc is correctly inferred as CustomerDocument | undefined.
                            const doc = (activeApplicant.customerDocuments as Record<string, CustomerDocument>)[docType] || { status: 'Pending' };
                            const statusInfo = getStatusInfo(doc.status);
                            return (
                                <li key={docType} className="bg-[var(--dark-bg)] p-3 rounded-lg border border-[var(--light-bg)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <i className={`${statusInfo.icon} ${statusInfo.iconColor} text-xl w-6 text-center`}></i>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-[var(--text-primary)] truncate">{docType}</p>
                                            {doc.fileName ? (
                                                <p className="text-xs text-[var(--text-primary)] mt-1 truncate opacity-90 font-medium" title={doc.fileName}>
                                                    <i className="fas fa-paperclip mr-1"></i> {doc.fileName}
                                                </p>
                                            ) : (
                                                <p className="text-xs text-[var(--text-secondary)] italic mt-1 opacity-80">No file uploaded</p>
                                            )}
                                        </div>
                                        <span className={`px-2 py-0.5 text-[10px] rounded-full font-semibold ring-1 ring-inset ${statusInfo.chip} sm:hidden`}>
                                            {doc.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                                        <span className={`px-2 py-0.5 text-[10px] rounded-full font-semibold ring-1 ring-inset ${statusInfo.chip} hidden sm:inline-block`}>
                                            {doc.status}
                                        </span>
                                        {doc.fileName && (
                                            <button onClick={() => handlePreview(docType, doc)} className="px-2 py-1 text-[10px] rounded-md bg-gray-500/80 text-white font-semibold hover:bg-gray-600 transition-colors">
                                                Preview
                                            </button>
                                        )}
                                        {doc.status === 'Uploaded' && (
                                            <>
                                                <button onClick={() => handleVerify(activeApplicant.id, docType)} className="px-2 py-1 text-[10px] rounded-md bg-green-600/80 text-white font-semibold hover:bg-green-700 transition-colors">Verify</button>
                                                <button onClick={() => handleReject(activeApplicant.id, docType)} className="px-2 py-1 text-[10px] rounded-md bg-red-600/80 text-white font-semibold hover:bg-red-700 transition-colors">Reject</button>
                                            </>
                                        )}
                                        <button onClick={() => handleUploadClick(activeApplicant.id, docType)} className="px-2 py-1 text-[10px] rounded-md bg-blue-600/80 text-white font-semibold hover:bg-blue-700 transition-colors">
                                            <i className="fas fa-upload mr-1"></i>
                                            {doc.status === 'Pending' || doc.status === 'Rejected' ? 'Upload' : 'Re-upload'}
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
        <div className="p-4 sm:p-6">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            <div className="flex justify-between items-center mb-4 px-1">
                <h4 className="text-[10px] font-semibold uppercase text-[var(--text-secondary)] tracking-widest">Transaction Sequence</h4>
                <span className="text-[10px] font-bold text-green-500 uppercase"><i className="fas fa-check-circle mr-1"></i> Booking Confirmed</span>
            </div>
            <div className="flex flex-col">
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
            </div>
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
    const documents = [
        { name: 'Project Brochure', icon: 'fas fa-book-open', description: 'Marketing material with project details and images.' },
        { name: 'RERA Certificate', icon: 'fas fa-certificate', description: 'Official RERA registration certificate for the project.' },
        { name: 'Floor Plans', icon: 'fas fa-ruler-combined', description: 'Architectural drawings of the unit layouts.' },
        { name: 'Legal Title Report', icon: 'fas fa-gavel', description: 'Report verifying the legal ownership of the land.' },
        { name: 'Commencement Certificate', icon: 'fas fa-hard-hat', description: 'Approval from authorities to begin construction.' },
    ];

    if (!project) {
        return (
             <div className="p-8 text-center text-[var(--text-secondary)] flex flex-col items-center justify-center h-full">
                <i className="fas fa-folder-minus text-4xl mb-4"></i>
                <h4 className="font-semibold text-[var(--text-primary)]">No Project Assigned</h4>
                <p className="text-sm mt-1 max-w-xs">This lead is not yet assigned to a project. Project-level documents will appear here once assigned.</p>
            </div>
        )
    }

    return (
        <div className="p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4 px-1">
                <h4 className="text-[10px] font-semibold uppercase text-[var(--text-secondary)] tracking-widest">Project Reference Material</h4>
                <span className="text-[10px] font-bold text-[var(--primary-color)]">{project.name}</span>
            </div>
            <div className="flex flex-col">
                 {documents.map((doc, idx) => (
                    <DocumentRow 
                        key={doc.name}
                        name={doc.name}
                        icon={doc.icon}
                        description={doc.description}
                        step={idx + 1}
                        onView={() => toast.info(`A preview for “${doc.name}” isn't available yet.`)}
                    />
                ))}
            </div>
        </div>
    );
};

const DocumentHub: React.FC<DocumentHubProps> = ({ lead, project, onUpdateApplicantDocument, onUpdateLeadLifecycle, onUpdateCustomData, activeTab, setActiveTab }) => {
  const tabs: { key: DocHubTab; label: string; icon: string }[] = [
    { key: 'Customer KYC', label: 'Customer KYC', icon: 'fas fa-id-card' },
    { key: 'Unit Documents', label: 'Unit Documents', icon: 'fas fa-file-contract' },
    { key: 'Project Documents', label: 'Project Documents', icon: 'fas fa-building-flag' },
  ];

  const currentTab = (activeTab as DocHubTab) || 'Customer KYC';

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
        <div className="border-b border-[var(--light-bg)] flex-shrink-0">
            <nav className="flex flex-wrap -mb-px px-4">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab?.(tab.key)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                            currentTab === tab.key
                                ? 'border-[var(--primary-color)] text-[var(--primary-color)]'
                                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                    >
                        <i className={tab.icon}></i>
                        <span>{tab.label}</span>
                    </button>
                ))}
            </nav>
        </div>
        <div className="flex-1 overflow-y-auto">
            {renderContent()}
        </div>
    </div>
  );
};

export default DocumentHub;
