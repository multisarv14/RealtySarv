
import React from 'react';
import { Lead, Project } from '../../types';
import BookingFormTemplate from '../document_templates/BookingFormTemplate';
import AllotmentLetterTemplate from '../document_templates/AllotmentLetterTemplate';
import PossessionLetterTemplate from '../document_templates/PossessionLetterTemplate';
import { Modal, Button } from '../ui/Modal';
import PaymentReceiptTemplate from '../document_templates/PaymentReceiptTemplate';
import DemandLetterTemplate from '../document_templates/DemandLetterTemplate';

// Exported type to be used in other components like DocumentHub to ensure type consistency
export type UnitDocTemplate = 
    | 'Booking Form' 
    | 'Allotment Letter' 
    | 'Possession Letter' 
    | 'Agreement Draft' 
    | 'Registered Agreement'
    | 'Tripartite Agreement'
    | 'Maintenance Agreement'
    | 'Parking Allotment Letter' 
    | 'Possession Receipt' 
    | 'Flat NOC' 
    | 'Payment Receipt' 
    | 'Demand Letter'
    | 'Handover Checklist'
    | 'Unit Layout Plan'
    | 'Share Certificate'
    | 'Interest Letter'
    | 'GST Installment Letter'
    | 'Payment Reminder'
    | 'Cancellation Notice'
    | 'Challan Copy'; // Added 'Challan Copy' to resolve type error on line 454 of DocumentHub


interface UnitDocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateType: UnitDocTemplate;
  lead: Lead;
  project: Project | null;
  extraData?: any; // For passing specific payment record or milestone
}

const UnitDocumentViewerModal: React.FC<UnitDocumentViewerModalProps> = ({ isOpen, onClose, templateType, lead, project, extraData }) => {
  const printRef = React.useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (printContent) {
        const printWindow = window.open('', '', 'height=800,width=800');
        if (printWindow) {
            printWindow.document.write('<html><head><title>Print Document</title>');
            printWindow.document.write('<style>body { font-family: "Times New Roman", Times, serif; } table { width: 100%; border-collapse: collapse; } td, th { border: 1px solid #ccc; padding: 8px; } .no-print { display: none; } </style>');
            printWindow.document.write('</head><body>');
            printWindow.document.write(printContent.innerHTML);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.print();
        }
    }
  };
  
  const renderTemplate = () => {
    switch(templateType) {
        case 'Booking Form':
            return <BookingFormTemplate lead={lead} project={project} />;
        case 'Allotment Letter':
            return <AllotmentLetterTemplate lead={lead} project={project} />;
        case 'Possession Letter':
            return <PossessionLetterTemplate lead={lead} project={project} />;
        case 'Payment Receipt':
            return <PaymentReceiptTemplate lead={lead} project={project} payment={extraData} />;
        case 'Demand Letter':
            return <DemandLetterTemplate lead={lead} project={project} data={extraData?.milestone ? extraData : undefined} milestone={!extraData?.milestone ? extraData : undefined} />;
        default:
            return (
                <div className="p-8 text-center text-gray-400">
                    <i className="fas fa-file-invoice text-5xl mb-4"></i>
                    <p>A template for <strong>{templateType}</strong> is being prepared based on your ledger data.</p>
                    <p className="text-xs mt-2">You can preview the statutory content and layout here once finalized.</p>
                </div>
            );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" title={templateType} subtitle={`${lead.name}${project ? ' · ' + project.name : ''}`}
      footer={<><Button type="button" tone="ghost" onClick={onClose}>Close</Button><Button type="button" onClick={handlePrint}><i className="fas fa-print" aria-hidden="true"></i>Print or save as PDF</Button></>}>
      <div className="h-[64vh] -m-1 rounded-lg bg-gray-200 p-3 sm:p-5 overflow-y-auto text-black">
        <div ref={printRef} className="bg-white max-w-[210mm] min-h-[297mm] mx-auto p-8 sm:p-12 shadow-lg">
          {renderTemplate()}
        </div>
      </div>
    </Modal>
  );
};

export default UnitDocumentViewerModal;
