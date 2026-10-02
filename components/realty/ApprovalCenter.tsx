
import React from 'react';
import { PurchaseRequisition, PurchaseOrder, User, ApprovalRule, PRStatus, POStatus } from '../../types';
import { db } from '../../db';
import { useLiveQuery } from '../../liveQuery';

interface ApprovalCenterProps {
  currentUser: User;
}

const ApprovalCenter: React.FC<ApprovalCenterProps> = ({ currentUser }) => {
  const prs = useLiveQuery(() => db.purchaseRequisitions.toArray(), []);
  const po = useLiveQuery(() => db.purchaseOrders.toArray(), []);
  const rules = useLiveQuery(() => db.approvalRules.toArray(), []);
  
  const [selectedRequest, setSelectedRequest] = React.useState<any>(null);
  const [comments, setComments] = React.useState('');

  const pendingApprovals = React.useMemo(() => {
    if (!prs || !po || !rules) return [];
    
    return [
        ...(prs.filter(p => p.status.startsWith('Pending')) || []).map(p => ({ ...p, type: 'PR' })),
        ...(po.filter(p => p.status === 'Approval Pending') || []).map(p => ({ ...p, type: 'PO' }))
    ].sort((a,b) => b.date.localeCompare(a.date));
  }, [prs, po, rules]);

  const handleAction = async (action: 'Approve' | 'Reject') => {
      if (!selectedRequest) return;
      
      const timestamp = new Date().toISOString();
      const approvalLog = {
          id: Math.random().toString(36).substr(2, 9),
          userId: currentUser.id,
          userName: currentUser.name,
          action: action === 'Approve' ? 'Approved' : 'Rejected' as any,
          timestamp,
          comments,
          step: selectedRequest.status
      };

      if (selectedRequest.type === 'PR') {
          let nextStatus: PRStatus = 'Approved';
          if (action === 'Approve') {
              if (selectedRequest.status === 'Pending Project Mgr') nextStatus = 'Pending Accounts';
              else if (selectedRequest.status === 'Pending Accounts') nextStatus = 'Pending Management';
              else nextStatus = 'Approved';
          } else {
              nextStatus = 'Rejected';
          }

          await db.purchaseRequisitions.update(selectedRequest.id, { 
              status: nextStatus,
              approvalHistory: [...(selectedRequest.approvalHistory || []), approvalLog]
          });
      } else {
          // Fixed: type assertion for POStatus rejection which is now defined in types.ts
          await db.purchaseOrders.update(selectedRequest.id, {
              status: (action === 'Approve' ? 'Approved' : 'Rejected') as POStatus,
              approvalHistory: [...(selectedRequest.approvalHistory || []), approvalLog]
          });
      }

      await db.auditTrails.add({
          id: Math.random().toString(36).substr(2, 9),
          userId: currentUser.id,
          userName: currentUser.name,
          action: `${selectedRequest.type}_${action.toUpperCase()}`,
          module: 'Procurement',
          entityId: selectedRequest.id,
          timestamp,
          details: `${action} request ${selectedRequest.prNumber || selectedRequest.poNumber}. Comments: ${comments}`
      });

      setSelectedRequest(null);
      setComments('');
  };

  return (
    <div className="p-8 h-full flex flex-col gap-6 animate-fadeIn">
      <div className="flex justify-between items-center">
          <div>
              <h3 className="text-xl font-bold text-slate-800 uppercase tracking-wider">Approval Center</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">Multi-stage Authorization Matrix</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 px-4 py-2 rounded-lg flex items-center gap-3">
              <i className="fas fa-user-shield text-blue-500"></i>
              <span className="text-xs font-bold text-blue-700 uppercase">{currentUser.role} Control</span>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 overflow-hidden">
          {/* Pending List */}
          <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col shadow-sm">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <h4 className="font-bold text-slate-800 uppercase text-xs tracking-wider">Inbox</h4>
                  <span className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">{pendingApprovals.length} Requests</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {pendingApprovals.map(req => (
                      <button 
                        key={req.id} 
                        onClick={() => setSelectedRequest(req)}
                        className={`w-full p-4 rounded-xl border text-left transition-all ${selectedRequest?.id === req.id ? 'bg-blue-600 border-blue-600 shadow-md translate-x-1' : 'bg-white border-slate-100 hover:border-blue-300'}`}
                      >
                          <div className="flex justify-between items-start mb-2">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${selectedRequest?.id === req.id ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'}`}>{req.type}</span>
                              <span className={`text-[10px] ${selectedRequest?.id === req.id ? 'text-blue-100' : 'text-slate-400'}`}>{req.date}</span>
                          </div>
                          {/* Fixed: Use type-safe property access for inferred union types */}
                          <p className={`font-bold text-sm ${selectedRequest?.id === req.id ? 'text-white' : 'text-slate-800'}`}>{(req as any).prNumber || (req as any).poNumber}</p>
                          <p className={`text-[10px] mt-1 truncate ${selectedRequest?.id === req.id ? 'text-blue-100' : 'text-slate-500'}`}>{(req as any).remarks || 'No remarks provided'}</p>
                          {(req as any).isEmergency && <div className={`mt-2 text-[9px] font-bold uppercase flex items-center gap-1 ${selectedRequest?.id === req.id ? 'text-white' : 'text-red-500'}`}><i className="fas fa-bolt"></i> Emergency</div>}
                      </button>
                  ))}
                  {pendingApprovals.length === 0 && (
                      <div className="text-center py-20 opacity-30">
                          <i className="fas fa-check-double text-4xl mb-2 text-slate-300"></i>
                          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Clear for now</p>
                      </div>
                  )}
              </div>
          </div>

          {/* Details & Action */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col shadow-sm relative">
              {selectedRequest ? (
                  <>
                      <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-start">
                          <div>
                              <h4 className="text-xl font-bold text-slate-800">{selectedRequest.prNumber || selectedRequest.poNumber}</h4>
                              <p className="text-xs text-blue-600 font-bold uppercase mt-1">Pending at: {selectedRequest.status}</p>
                          </div>
                          <div className="text-right">
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Request Amount</p>
                              <p className="text-2xl font-bold text-slate-800">₹{(selectedRequest.totalAmount || selectedRequest.grandTotal || 0).toLocaleString()}</p>
                          </div>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                           <div className="mb-8">
                               <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-50 pb-1">Workflow History</h5>
                               <div className="space-y-4">
                                   {(selectedRequest.approvalHistory || []).map((log: any) => (
                                       <div key={log.id} className="flex gap-4 items-start">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ${log.action === 'Approved' ? 'bg-green-500' : 'bg-red-500'}`}>
                                                <i className={`fas ${log.action === 'Approved' ? 'fa-check' : 'fa-times'}`}></i>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-800">{log.userName} • <span className="text-slate-400 font-normal">{log.step}</span></p>
                                                <p className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleString()}</p>
                                                {log.comments && <p className="text-xs text-slate-500 mt-1 italic">"{log.comments}"</p>}
                                            </div>
                                       </div>
                                   ))}
                                   <div className="flex gap-4 items-start opacity-50">
                                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs animate-pulse">
                                            <i className="fas fa-ellipsis"></i>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-800">Current Stage: {selectedRequest.status}</p>
                                            <p className="text-[10px] text-slate-400">Awaiting your authorization...</p>
                                        </div>
                                   </div>
                               </div>
                           </div>

                           <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                               <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider">Approval Comments</label>
                               <textarea 
                                 value={comments}
                                 onChange={e => setComments(e.target.value)}
                                 placeholder="Add justification or reason for rejection..."
                                 className="w-full bg-white border border-slate-200 rounded p-3 text-sm text-slate-800 focus:border-blue-500 outline-none h-24 shadow-inner"
                               ></textarea>
                               <div className="flex gap-4 mt-6">
                                   <button 
                                     onClick={() => handleAction('Reject')}
                                     className="flex-1 py-3 rounded-lg border border-red-200 text-red-600 font-bold uppercase text-xs tracking-wider hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                   >
                                       Reject Request
                                   </button>
                                   <button 
                                     onClick={() => handleAction('Approve')}
                                     className="flex-1 py-3 rounded-lg bg-green-600 text-white font-bold uppercase text-xs tracking-wider hover:bg-green-700 transition-all shadow-md shadow-green-500/10"
                                   >
                                       Authorize & Approve
                                   </button>
                               </div>
                           </div>
                      </div>
                  </>
              ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
                      <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-blue-500 text-3xl">
                          <i className="fas fa-stamp"></i>
                      </div>
                      <h4 className="text-slate-800 font-bold uppercase tracking-wider">Select a request to review</h4>
                      <p className="text-sm text-slate-400 mt-2">All pending PRs and POs requiring your authorization will appear here.</p>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default ApprovalCenter;
