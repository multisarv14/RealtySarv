
import React from 'react';
import { AuditTrail } from '../../types';
import { db } from '../../db';
import { useLiveQuery } from '../../liveQuery';

const AuditTrailView: React.FC = () => {
  const logs = useLiveQuery(() => db.auditTrails.orderBy('timestamp').reverse().toArray(), []);
  const [filterModule, setFilterModule] = React.useState('All');

  const filteredLogs = React.useMemo(() => {
    if (!logs) return [];
    if (filterModule === 'All') return logs;
    return logs.filter(l => l.module === filterModule);
  }, [logs, filterModule]);

  const getActionIcon = (action: string) => {
      if (action.includes('APPROVED')) return 'fa-check-circle text-green-500';
      if (action.includes('REJECTED')) return 'fa-times-circle text-red-500';
      if (action.includes('CREATED')) return 'fa-plus-circle text-blue-500';
      if (action.includes('FROZEN')) return 'fa-lock text-orange-500';
      return 'fa-info-circle text-slate-400';
  };

  return (
    <div className="p-8 h-full flex flex-col gap-6 animate-fadeIn">
      <div className="flex justify-between items-center">
          <div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-wider">System Audit Trail</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">Immutable Operational Logs</p>
          </div>
          <div className="flex gap-3">
              <select 
                value={filterModule}
                onChange={e => setFilterModule(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-xs font-bold text-blue-600 uppercase outline-none shadow-sm"
              >
                  <option value="All">All Modules</option>
                  <option value="Procurement">Procurement</option>
                  <option value="Cost Center">Cost Center</option>
                  <option value="Inventory">Inventory</option>
                  <option value="Master Data">Master Data</option>
              </select>
              <button className="bg-white text-blue-600 border border-slate-200 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-colors shadow-sm"><i className="fas fa-download mr-2"></i> Export Audit Log</button>
          </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
          <div className="p-4 bg-slate-50 border-b border-slate-100 font-black text-[10px] text-blue-600 uppercase tracking-[0.2em]">Activity Ledger</div>
          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-50">
              {filteredLogs.map(log => (
                  <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors flex gap-6 items-start">
                      <div className="w-32 flex-shrink-0">
                          <p className="text-[10px] font-black text-slate-400 uppercase">{new Date(log.timestamp).toLocaleDateString()}</p>
                          <p className="text-xs font-mono text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</p>
                      </div>
                      <div className="w-8 flex-shrink-0 flex justify-center pt-1">
                          <i className={`fas ${getActionIcon(log.action)} text-lg`}></i>
                      </div>
                      <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-black text-blue-600 uppercase">{log.module}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                              <span className="text-xs font-bold text-slate-800">{log.userName}</span>
                          </div>
                          <p className="text-sm text-slate-600">{log.details}</p>
                          <div className="mt-2 text-[9px] font-mono text-slate-400 uppercase">Entity ID: {log.entityId}</div>
                      </div>
                  </div>
              ))}
              {filteredLogs.length === 0 && (
                  <div className="p-20 text-center text-slate-400 italic">No logs found for the selected criteria.</div>
              )}
          </div>
      </div>
    </div>
  );
};

export default AuditTrailView;
