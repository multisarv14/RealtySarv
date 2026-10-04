
import React from 'react';
import { User, Lead, Project, PaymentPlan, BookingDetails } from '../types';
import UnitDocumentViewerModal from './modals/UnitDocumentViewerModal';

interface BookingDetailTabProps {
  lead: Lead;
  users?: User[];
  project: Project | null;
  paymentPlans: PaymentPlan[];
  onStartBooking: () => void;
  onEditBooking: () => void;
  onUpdateBooking: (leadId: string, bookingDetails: BookingDetails) => void;
}

const BookingDetailTab: React.FC<BookingDetailTabProps> = ({ lead, users = [], project, paymentPlans, onStartBooking, onEditBooking }) => {
  const [viewingDoc, setViewingDoc] = React.useState<{ type: 'Payment Receipt' | 'Demand Letter', data: any } | null>(null);

  if (lead.bookingStatus !== 'Booked' || !lead.bookingDetails) {
    return (
      <div className="flex-1 p-8 flex flex-col items-center justify-center text-center h-full bg-[var(--dark-bg)]">
        <i className="fas fa-file-signature text-5xl text-[var(--text-secondary)] mb-4"></i>
        <h3 className="text-xl font-bold text-[var(--text-primary)]">No Booking Active</h3>
        <p className="text-[var(--text-secondary)] mt-2 mb-6 max-w-md">
          This lead has not booked a unit yet. Start the booking process to track payments, demands, and agreements.
        </p>
        <button 
          onClick={onStartBooking}
          className="px-6 py-3 rounded-md bg-[var(--primary-color)] text-white font-bold hover:bg-[#128c7e] transition-colors shadow-lg"
        >
          Book Unit Now
        </button>
      </div>
    );
  }

  const { priceBreakup, tokenDetails, payments = [] } = lead.bookingDetails;
  const unit = project?.inventory.find(u => u.id === lead.bookingDetails?.unitId);
  const plan = paymentPlans.find(p => p.id === lead.bookingDetails?.paymentPlanId);

  const totalPaid = (tokenDetails.amount || 0) + payments.reduce((sum, p) => sum + p.amount, 0);
  const totalDue = priceBreakup.grandTotal;
  const balanceDue = totalDue - totalPaid;
  const progress = Math.min((totalPaid / totalDue) * 100, 100);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[var(--dark-bg)] space-y-6 animate-fadeIn">
      {/* 1. Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[var(--medium-bg)] p-4 rounded-lg shadow border border-[var(--light-bg)]">
          <p className="text-[10px] font-bold uppercase text-[var(--text-secondary)] tracking-wider mb-1">Agreement Value</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">₹{totalDue.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-[var(--medium-bg)] p-4 rounded-lg shadow border border-[var(--light-bg)]">
          <p className="text-[10px] font-bold uppercase text-[var(--text-secondary)] tracking-wider mb-1">Total Paid</p>
          <p className="text-2xl font-bold text-green-500">₹{totalPaid.toLocaleString('en-IN')}</p>
          <div className="w-full bg-[var(--dark-bg)] h-1 mt-2 rounded-full overflow-hidden">
            <div className="bg-green-500 h-full transition-all duration-700" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
        <div className="bg-[var(--medium-bg)] p-4 rounded-lg shadow border border-[var(--light-bg)]">
          <p className="text-[10px] font-bold uppercase text-[var(--text-secondary)] tracking-wider mb-1">Balance Payable</p>
          <p className="text-2xl font-bold text-red-500">₹{balanceDue.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* 2. Booking Info */}
      <div className="bg-[var(--medium-bg)] p-6 rounded-xl shadow-md relative border border-[var(--light-bg)]">
          <div className="absolute top-4 right-4">
              <button onClick={onEditBooking} className="text-xs font-bold uppercase text-[var(--primary-color)] hover:underline flex items-center gap-1.5"><i className="fas fa-edit"></i> Edit Details</button>
          </div>
          <h4 className="text-xs font-bold uppercase text-[var(--text-primary)] mb-6 flex items-center gap-2 opacity-60 tracking-wider"><i className="fas fa-info-circle text-blue-400"></i> Property Allotment Info</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                  <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Inventory Unit</p>
                  <p className="font-bold text-sm text-[var(--text-primary)]">{unit ? `${unit.unitNumber} (${unit.type})` : 'N/A'}</p>
              </div>
              <div>
                  <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Parking Slot</p>
                  <p className="font-bold text-sm text-[var(--text-primary)]">{lead.bookingDetails.parkingId ? 'Allocated' : 'Not Assigned'}</p>
              </div>
              <div>
                  <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Standard Plan</p>
                  <p className="font-bold text-sm text-[var(--text-primary)]">{plan?.name || 'Custom Plan'}</p>
              </div>
              <div>
                  <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Booking Date</p>
                  <p className="font-bold text-sm text-[var(--text-primary)]">{lead.bookingDetails.bookingDate || tokenDetails.transactionDate}</p>
              </div>
              <div>
                  <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Sales Executive</p>
                  <p className="font-bold text-sm text-[var(--text-primary)]" data-testid="sales-executive">{users.find(u => u.id === (lead.bookingDetails.salesExecutiveId || lead.ownerId))?.name || 'Not set'}</p>
              </div>
          </div>
      </div>

      {/* 3. Token / Booking Payment Details */}
      <div className="bg-[#1a73e8]/5 p-6 rounded-xl border border-[#1a73e8]/20 shadow-sm">
          <h4 className="text-xs font-bold uppercase text-[#1a73e8] mb-6 flex items-center gap-2 tracking-wider"><i className="fas fa-key"></i> Initial Booking Receipt</h4>
          <div className="bg-[var(--dark-bg)] p-4 rounded-xl border border-[var(--light-bg)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 border border-green-500/20">
                      <i className="fas fa-check-double text-xl"></i>
                  </div>
                  <div>
                      <p className="font-bold text-sm text-[var(--text-primary)] uppercase tracking-tight">Booking Token Entry</p>
                      <p className="text-[10px] text-[var(--text-secondary)] font-mono mt-0.5">TXN: {tokenDetails.transactionId} • {tokenDetails.bankName}</p>
                  </div>
              </div>
              <div className="flex flex-col md:items-end gap-1 w-full md:w-auto border-t md:border-t-0 border-[var(--light-bg)] pt-3 md:pt-0">
                  <p className="text-lg font-bold text-green-400">₹{tokenDetails.amount.toLocaleString('en-IN')}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">{tokenDetails.transactionDate}</span>
                    <button 
                        onClick={() => setViewingDoc({ 
                            type: 'Payment Receipt', 
                            data: { 
                                id: 'TOKEN', 
                                amount: tokenDetails.amount, 
                                date: tokenDetails.transactionDate, 
                                mode: tokenDetails.mode, 
                                transactionId: tokenDetails.transactionId, 
                                bankName: tokenDetails.bankName,
                                milestoneName: 'Booking Token' 
                            } 
                        })}
                        className="text-[10px] font-bold uppercase text-[#1a73e8] hover:underline"
                    >
                        View Receipt
                    </button>
                  </div>
              </div>
          </div>
          <p className="mt-4 text-[10px] text-gray-500 italic px-2">Detailed payment history and construction-linked demands can be managed under the <strong className="text-[var(--primary-color)]">LEDGER</strong> tab.</p>
      </div>

      {viewingDoc && (
          <UnitDocumentViewerModal 
            isOpen={!!viewingDoc}
            onClose={() => setViewingDoc(null)}
            templateType={viewingDoc.type}
            lead={lead}
            project={project}
            extraData={viewingDoc.data}
          />
      )}
    </div>
  );
};

export default BookingDetailTab;
