
import React from 'react';
import { db } from '../../db';
import { useLiveQuery } from '../../liveQuery';
import { v4 as uuidv4 } from 'uuid';
import { CostHeadMasterItem, CostHeadCategory } from '../../types';
import { SHOW_DELETE } from '../../features';

const CostHeadMaster: React.FC = () => {
    const costHeads = useLiveQuery(() => db.costHeadMaster.toArray(), []);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [showAddModal, setShowAddModal] = React.useState(false);
    const [filterCategory, setFilterCategory] = React.useState<CostHeadCategory | 'All'>('All');

    const filteredHeads = React.useMemo(() => {
        const safeHeads = costHeads || [];
        return safeHeads.filter(h => {
            const matchesSearch = h.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                 (h.description?.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesCategory = filterCategory === 'All' || h.category === filterCategory;
            return matchesSearch && matchesCategory;
        });
    }, [costHeads, searchTerm, filterCategory]);

    const handleAddCostHead = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const name = fd.get('name') as string;
        const category = fd.get('category') as CostHeadCategory;
        const description = fd.get('description') as string;

        if (!name.trim()) return;

        const newItem: CostHeadMasterItem = {
            id: uuidv4(),
            name,
            category,
            description,
            isActive: true
        };

        await db.costHeadMaster.add(newItem);
        await db.auditTrails.add({
            id: uuidv4(),
            userId: 'system',
            userName: 'Admin',
            action: 'COST_HEAD_CREATED',
            module: 'Master Data',
            entityId: newItem.id,
            timestamp: new Date().toISOString(),
            details: `Created new cost head: ${name} (${category})`
        });

        setShowAddModal(false);
    };

    const handleDelete = async (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete "${name}"? Existing projects using this head may be affected.`)) {
            await db.costHeadMaster.delete(id);
        }
    };

    const toggleActive = async (id: string, current: boolean) => {
        await db.costHeadMaster.update(id, { isActive: !current });
    };

    return (
        <div className="p-6 h-full flex flex-col gap-6 animate-fadeIn">
            {/* Header / Filter Toolbar */}
            <div className="bg-white p-4 rounded border border-[#dadce0] shadow-sm flex flex-col lg:flex-row justify-between items-center gap-4">
                <div className="flex flex-1 items-center gap-4 w-full">
                    <div className="relative w-full max-w-md">
                         <input 
                            type="text" 
                            placeholder="Filter cost heads..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-[#f1f3f4] border-b border-transparent focus:border-[#1a73e8] rounded-t px-10 py-2 text-sm text-gray-900 outline-none transition-all"
                         />
                         <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"></i>
                    </div>
                    <div className="h-6 w-px bg-[#dadce0] hidden lg:block"></div>
                    <div className="flex gap-4">
                        {(['All', 'Direct', 'Construction', 'Indirect'] as const).map(cat => (
                            <button 
                                key={cat}
                                onClick={() => setFilterCategory(cat)}
                                className={`text-xs font-bold uppercase transition-all px-1 py-2 border-b-2 ${filterCategory === cat ? 'text-[#1a73e8] border-[#1a73e8]' : 'text-gray-500 border-transparent hover:text-gray-800'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="bg-[#1a73e8] text-white px-4 py-2 rounded text-sm font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-2 whitespace-nowrap"
                >
                  <i className="fas fa-plus"></i> CREATE COST HEAD
                </button>
            </div>

            {/* Main List */}
            <div className="bg-white rounded border border-[#dadce0] shadow-sm flex-1 flex flex-col overflow-hidden">
                <div className="overflow-x-auto flex-1 custom-scrollbar">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead className="bg-[#f8f9fa] border-b border-[#dadce0]">
                            <tr className="text-gray-600 font-semibold uppercase text-[11px] tracking-wider">
                                <th className="px-4 py-3">Head Nomenclature</th>
                                <th className="px-4 py-3">Financial Category</th>
                                <th className="px-4 py-3">Scope / Description</th>
                                <th className="px-4 py-3 text-center">Status</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#dadce0]">
                            {filteredHeads.map(head => (
                                <tr key={head.id} className={`hover:bg-[#f8f9fa] transition-all group ${!head.isActive ? 'opacity-50' : ''}`}>
                                    <td className="px-4 py-4">
                                        <div className="font-medium text-[#1a73e8] hover:underline cursor-pointer">{head.name}</div>
                                        <div className="text-[10px] font-mono text-gray-400 mt-0.5">UUID: {head.id.substring(0, 8).toUpperCase()}</div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tight border ${
                                            head.category === 'Direct' ? 'bg-blue-50 text-[#1a73e8] border-blue-200' :
                                            head.category === 'Construction' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                            'bg-purple-50 text-purple-700 border-purple-200'
                                        }`}>
                                            {head.category}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <p className="text-gray-500 text-xs italic line-clamp-1 max-w-sm">{head.description || 'No detailed scope provided.'}</p>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <div className={`w-2 h-2 rounded-full mx-auto ${head.isActive ? 'bg-[#1e8e3e]' : 'bg-gray-300'}`}></div>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <div className="flex justify-end gap-1">
                                            <button onClick={() => toggleActive(head.id, head.isActive)} className="p-2 text-gray-500 hover:text-[#1a73e8] transition-colors"><i className="fas fa-power-off text-xs"></i></button>
                                            {SHOW_DELETE && <button onClick={() => handleDelete(head.id, head.name)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><i className="fas fa-trash-alt text-xs"></i></button>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredHeads.length === 0 && (
                        <div className="p-24 text-center flex flex-col items-center">
                             <i className="fas fa-tags text-4xl text-gray-100 mb-4"></i>
                             <p className="text-sm font-medium text-gray-400">Resource list is empty.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Modal - Refined Height and Width */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-[110] p-4 animate-fadeIn backdrop-blur-[1px]">
                    <div className="bg-white rounded shadow-2xl w-full max-w-xl border border-[#dadce0] overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="px-5 py-3.5 border-b border-[#dadce0] bg-[#f8f9fa] flex justify-between items-center">
                            <h3 className="text-base font-medium text-[#202124]">New Budgetary Cost Head</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-[#5f6368] hover:text-[#202124] p-1 hover:bg-black/5 rounded-full transition-all">
                                <i className="fas fa-times text-base"></i>
                            </button>
                        </div>
                        <form onSubmit={handleAddCostHead} className="p-6 space-y-5">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-[#5f6368] uppercase mb-1">Head Nomenclature *</label>
                                    <input name="name" required placeholder="e.g. Land Acquisition Fees" className="w-full bg-[#f1f3f4] border-b border-[#dadce0] focus:border-[#1a73e8] px-3 py-2 text-sm text-gray-900 outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-[#5f6368] uppercase mb-1">Financial Classification *</label>
                                    <select name="category" required className="w-full bg-[#f1f3f4] border-b border-[#dadce0] focus:border-[#1a73e8] px-3 py-2 text-sm outline-none transition-all cursor-pointer">
                                        <option value="Direct">Direct Cost</option>
                                        <option value="Construction">Construction Ops</option>
                                        <option value="Indirect">Indirect / Overhead</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-[#5f6368] uppercase mb-1">Budgetary Scope (Optional)</label>
                                    <textarea name="description" rows={3} placeholder="Define what specific costs fall under this head..." className="w-full bg-[#f1f3f4] border-b border-[#dadce0] focus:border-[#1a73e8] px-3 py-2 text-sm text-gray-900 outline-none transition-all resize-none"></textarea>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-4 border-t border-[#dadce0]">
                                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-1.5 text-[#1a73e8] text-sm font-bold hover:bg-[#e8f0fe] rounded transition-colors">CANCEL</button>
                                <button type="submit" className="px-5 py-1.5 bg-[#1a73e8] text-white text-sm font-bold rounded shadow-sm hover:shadow-md hover:bg-[#1557b0] transition-all">CREATE</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CostHeadMaster;
