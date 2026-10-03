
import React from 'react';
import { Project, InventoryUnit, ParkingSlot, InventoryUnitStatus, ProjectType, ProjectStatus, PaymentPlan } from '../../types';
import GenerateInventoryModal from './GenerateInventoryModal';
import { toast } from '../ui/Toast';
import { confirmDialog } from '../ui/Confirm';
import { Field, Section, Button, inputCls, textareaCls } from '../ui/Modal';
import { SHOW_DELETE } from '../../features';

interface ProjectInventoryProps {
  project: Project;
  paymentPlans: PaymentPlan[];
  onUpdateProject: (updatedProject: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onBack: () => void;
}

const getStatusColor = (status: InventoryUnitStatus) => {
    switch (status) {
      case 'Available': return 'bg-green-600/90 text-green-100 border-green-500';
      case 'Booked': return 'bg-red-600/90 text-red-100 border-red-500';
      case 'On Hold': return 'bg-yellow-600/90 text-yellow-100 border-yellow-500';
      case 'Sold': return 'bg-gray-600/90 text-gray-300 border-gray-500';
      case 'Not for Sale': return 'bg-gray-800/90 text-gray-400 border-gray-600';
      default: return 'bg-gray-600/90 text-gray-100 border-gray-500';
    }
};

const EditUnitModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    unit: InventoryUnit;
    onSave: (updatedUnit: InventoryUnit) => void;
}> = ({ isOpen, onClose, unit, onSave }) => {
    const [status, setStatus] = React.useState<InventoryUnitStatus>(unit.status);
    const [price, setPrice] = React.useState<string>(unit.price.toString());
    const [type, setType] = React.useState<string>(unit.type);
    const [area, setArea] = React.useState<string>(unit.area.toString());
    const [carpetArea, setCarpetArea] = React.useState<string>(unit.carpetArea?.toString() || '');

    React.useEffect(() => {
        if (isOpen) {
            setStatus(unit.status);
            setPrice(unit.price.toString());
            setType(unit.type);
            setArea(unit.area.toString());
            setCarpetArea(unit.carpetArea?.toString() || '');
        }
    }, [isOpen, unit]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const updatedUnit: InventoryUnit = {
            ...unit,
            status,
            price: parseFloat(price) || 0,
            type,
            area: parseFloat(area) || 0,
            carpetArea: parseFloat(carpetArea) || undefined,
        };
        onSave(updatedUnit);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 animate-fadeIn" onClick={onClose}>
            <div className="bg-[var(--medium-bg)] p-6 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">Edit Unit {unit.unitNumber}</h3>
                    <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><i className="fas fa-times"></i></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-[var(--text-secondary)] mb-1">Status</label>
                        <select value={status} onChange={(e) => setStatus(e.target.value as InventoryUnitStatus)} className="w-full p-2 rounded bg-[var(--dark-bg)] text-[var(--text-primary)] border border-[var(--light-bg)] focus:outline-none focus:border-[var(--primary-color)]">
                            <option value="Available">Available</option>
                            <option value="Booked">Booked</option>
                            <option value="On Hold">On Hold</option>
                            <option value="Sold">Sold</option>
                            <option value="Not for Sale">Not for Sale</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-[var(--text-secondary)] mb-1">Unit Type</label>
                        <input type="text" value={type} onChange={(e) => setType(e.target.value)} className="w-full p-2 rounded bg-[var(--dark-bg)] text-[var(--text-primary)] border border-[var(--light-bg)] focus:outline-none focus:border-[var(--primary-color)]" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm text-[var(--text-secondary)] mb-1">Saleable Area (sqft)</label>
                            <input type="number" value={area} onChange={(e) => setArea(e.target.value)} className="w-full p-2 rounded bg-[var(--dark-bg)] text-[var(--text-primary)] border border-[var(--light-bg)] focus:outline-none focus:border-[var(--primary-color)]" />
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--text-secondary)] mb-1">Carpet Area (sqft)</label>
                            <input type="number" value={carpetArea} onChange={(e) => setCarpetArea(e.target.value)} className="w-full p-2 rounded bg-[var(--dark-bg)] text-[var(--text-primary)] border border-[var(--light-bg)] focus:outline-none focus:border-[var(--primary-color)]" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-[var(--text-secondary)] mb-1">Base Price (₹)</label>
                        <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full p-2 rounded bg-[var(--dark-bg)] text-[var(--text-primary)] border border-[var(--light-bg)] focus:outline-none focus:border-[var(--primary-color)]" />
                    </div>
                    <div className="flex justify-end pt-4">
                         <button type="submit" className="px-4 py-2 rounded bg-[var(--primary-color)] text-white font-medium hover:bg-[#128c7e] transition-colors">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const EditParkingModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    slot: ParkingSlot;
    onSave: (updatedSlot: ParkingSlot) => void;
}> = ({ isOpen, onClose, slot, onSave }) => {
    const [status, setStatus] = React.useState<InventoryUnitStatus>(slot.status);
    const [slotNumber, setSlotNumber] = React.useState(slot.slotNumber);
    const [level, setLevel] = React.useState(slot.level);

    React.useEffect(() => {
        if (isOpen) {
            setStatus(slot.status);
            setSlotNumber(slot.slotNumber);
            setLevel(slot.level);
        }
    }, [isOpen, slot]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...slot, status, slotNumber, level });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 animate-fadeIn" onClick={onClose}>
            <div className="bg-[var(--medium-bg)] p-6 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">Edit Slot {slot.slotNumber}</h3>
                    <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><i className="fas fa-times"></i></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label className="block text-sm text-[var(--text-secondary)] mb-1">Slot Number</label>
                        <input type="text" value={slotNumber} onChange={(e) => setSlotNumber(e.target.value)} className="w-full p-2 rounded bg-[var(--dark-bg)] text-[var(--text-primary)] border border-[var(--light-bg)] focus:outline-none focus:border-[var(--primary-color)]" />
                    </div>
                    <div>
                        <label className="block text-sm text-[var(--text-secondary)] mb-1">Level</label>
                        <input type="text" value={level} onChange={(e) => setLevel(e.target.value)} className="w-full p-2 rounded bg-[var(--dark-bg)] text-[var(--text-primary)] border border-[var(--light-bg)] focus:outline-none focus:border-[var(--primary-color)]" />
                    </div>
                    <div>
                        <label className="block text-sm text-[var(--text-secondary)] mb-1">Status</label>
                        <select value={status} onChange={(e) => setStatus(e.target.value as InventoryUnitStatus)} className="w-full p-2 rounded bg-[var(--dark-bg)] text-[var(--text-primary)] border border-[var(--light-bg)] focus:outline-none focus:border-[var(--primary-color)]">
                            <option value="Available">Available</option>
                            <option value="Booked">Booked</option>
                            <option value="On Hold">On Hold</option>
                            <option value="Sold">Sold</option>
                            <option value="Not for Sale">Not for Sale</option>
                        </select>
                    </div>
                    <div className="flex justify-end pt-4">
                         <button type="submit" className="px-4 py-2 rounded bg-[var(--primary-color)] text-white font-medium hover:bg-[#128c7e] transition-colors">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const SetupView: React.FC<{ 
    project: Project; 
    paymentPlans: PaymentPlan[]; 
    onUpdateProject: (p: Project) => void; 
    onDeleteProject: (id: string) => void;
    onBack: () => void;
}> = ({ project, paymentPlans, onUpdateProject, onDeleteProject, onBack }) => {
    const [name, setName] = React.useState(project.name);
    const [companyName, setCompanyName] = React.useState(project.companyName);
    const [location, setLocation] = React.useState(project.location);
    const [reraNumber, setReraNumber] = React.useState(project.reraNumber);
    const [projectType, setProjectType] = React.useState<ProjectType>(project.projectType);
    const [projectStatus, setProjectStatus] = React.useState<ProjectStatus>(project.projectStatus);
    const [description, setDescription] = React.useState(project.description);
    const [totalFloors, setTotalFloors] = React.useState<number | ''>(project.totalFloors);
    const [wings, setWings] = React.useState(project.wings?.join(', ') || '');
    const [paymentPlanIds, setPaymentPlanIds] = React.useState(project.paymentPlanIds || []);

    const [submitted, setSubmitted] = React.useState(false);
    const togglePlan = (planId: string) =>
        setPaymentPlanIds(prev => prev.includes(planId) ? prev.filter(id => id !== planId) : [...prev, planId]);

    const errors = {
      name: name.trim() ? '' : 'Enter the project name.',
      companyName: companyName.trim() ? '' : 'Enter the company name.',
      reraNumber: reraNumber.trim() ? '' : 'Enter the RERA number.',
      location: location.trim() ? '' : 'Enter the location.',
      totalFloors: Number(totalFloors) > 0 ? '' : 'Enter the number of floors.',
      description: description.trim() ? '' : 'Add a short description.',
    };
    const err = (k: keyof typeof errors) => (submitted && errors[k]) || null;
    const wingsArray = wings.split(',').map(w => w.trim()).filter(Boolean);
    const dirty = JSON.stringify([name, companyName, location, reraNumber, projectType, projectStatus, description, Number(totalFloors), wingsArray, paymentPlanIds]) !==
      JSON.stringify([project.name, project.companyName, project.location, project.reraNumber, project.projectType, project.projectStatus, project.description, project.totalFloors, project.wings || [], project.paymentPlanIds || []]);

    const handleSaveChanges = (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitted(true);
      if (Object.values(errors).some(Boolean)) { toast.error('Please fix the highlighted fields.'); return; }
      onUpdateProject({ ...project, name: name.trim(), companyName: companyName.trim(), location: location.trim(), reraNumber: reraNumber.trim(), projectType, projectStatus, description: description.trim(), totalFloors: Number(totalFloors), wings: wingsArray, paymentPlanIds });
      setSubmitted(false);
      toast.success('Project details saved.');
    };

    const handleDelete = async () => {
      if (await confirmDialog({ title: `Delete "${project.name}"?`, message: 'The project and its inventory are removed. This cannot be undone.', confirmLabel: 'Delete project', danger: true })) {
        onDeleteProject(project.id);
        onBack();
      }
    };

    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-6">
        <form onSubmit={handleSaveChanges} noValidate className="space-y-6">
          <div className="bg-[var(--dark-bg)] border border-[var(--light-bg)] rounded-xl p-5 space-y-6">
            <Section title="Project">
              <Field label="Project name" htmlFor="projectName" required error={err('name')}><input id="projectName" value={name} onChange={e => setName(e.target.value)} className={inputCls(!!err('name'))} /></Field>
              <Field label="Company name" htmlFor="companyName" required error={err('companyName')}><input id="companyName" value={companyName} onChange={e => setCompanyName(e.target.value)} className={inputCls(!!err('companyName'))} /></Field>
              <Field label="RERA number" htmlFor="reraNumber" required error={err('reraNumber')}><input id="reraNumber" value={reraNumber} onChange={e => setReraNumber(e.target.value)} className={inputCls(!!err('reraNumber'))} /></Field>
              <Field label="Type" htmlFor="projectType">
                <select id="projectType" value={projectType} onChange={e => setProjectType(e.target.value as ProjectType)} className={inputCls()}>
                  <option>Residential</option><option>Commercial</option><option>Mixed-Use</option>
                </select>
              </Field>
              <Field label="Status" htmlFor="projectStatus">
                <select id="projectStatus" value={projectStatus} onChange={e => setProjectStatus(e.target.value as ProjectStatus)} className={inputCls()}>
                  <option>Pre-launch</option><option>Under Construction</option><option>Ready to Move</option>
                </select>
              </Field>
              <Field label="Description" htmlFor="description" required error={err('description')} className="sm:col-span-2"><textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className={textareaCls(!!err('description'))} /></Field>
            </Section>
            <Section title="Location and structure">
              <Field label="Location" htmlFor="projectLocation" required error={err('location')}><input id="projectLocation" value={location} onChange={e => setLocation(e.target.value)} className={inputCls(!!err('location'))} /></Field>
              <Field label="Total floors" htmlFor="totalFloors" required error={err('totalFloors')}><input id="totalFloors" type="number" min="1" value={totalFloors} onChange={e => setTotalFloors(e.target.value === '' ? '' : parseInt(e.target.value, 10))} className={inputCls(!!err('totalFloors'))} /></Field>
              <Field label="Wings" htmlFor="wings" hint="Comma separated, e.g. A, B, C" className="sm:col-span-2"><input id="wings" value={wings} onChange={e => setWings(e.target.value)} className={inputCls()} /></Field>
            </Section>
            <section>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2.5 pb-1.5 border-b border-[var(--border-color)]">Payment plans offered</h4>
              {(paymentPlans || []).length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)]">No payment plans yet. Add them under Settings, Finances, Payment Plans.</p>
              ) : (
                <div className="flex flex-wrap gap-2" role="group" aria-label="Payment plans">
                  {paymentPlans.map(plan => {
                    const on = paymentPlanIds.includes(plan.id);
                    return (
                      <button key={plan.id} type="button" onClick={() => togglePlan(plan.id)} aria-pressed={on}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-colors flex items-center gap-1.5 ${on ? 'bg-[var(--primary-color)] border-[var(--primary-color)] text-white' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
                        {on && <i className="fas fa-check text-[10px]" aria-hidden="true"></i>}{plan.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
          <div className="flex items-center justify-end gap-3 sticky bottom-0 py-3 bg-[var(--medium-bg)]/95 backdrop-blur border-t border-[var(--light-bg)]">
            {dirty && <span className="text-xs text-[var(--text-secondary)] mr-auto">Unsaved changes</span>}
            <Button type="submit" disabled={!dirty}>Save changes</Button>
          </div>
        </form>

        {SHOW_DELETE && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 border border-red-500/30 rounded-xl">
          <div>
            <p className="font-semibold text-red-500">Delete this project</p>
            <p className="text-sm text-[var(--text-secondary)]">Removes the project and its inventory. This cannot be undone.</p>
          </div>
          <Button type="button" tone="danger" onClick={handleDelete}><i className="fas fa-trash-alt mr-2" aria-hidden="true"></i>Delete project</Button>
        </div>
        )}
      </div>
    );
  };

  const FloorInventoryView: React.FC<{ 
      project: Project; 
      onOpenGenerateModal: (wing?: string) => void;
      onUpdateProject: (p: Project) => void;
  }> = ({ project, onOpenGenerateModal, onUpdateProject }) => {
    const hasWings = project.wings && project.wings.length > 0;
    const [activeWing, setActiveWing] = React.useState<string | null>(hasWings ? project.wings![0] : null);
    const [typeFilter, setTypeFilter] = React.useState<string>('All');
    const [statusFilter, setStatusFilter] = React.useState<InventoryUnitStatus | 'All'>('All');
    const [editingUnit, setEditingUnit] = React.useState<InventoryUnit | null>(null);

    const safeInventory = React.useMemo(() => project.inventory || [], [project.inventory]);

    const inventoryForView = React.useMemo(() => {
        if (!hasWings) return safeInventory;
        return safeInventory.filter(unit => unit.wing === activeWing);
    }, [hasWings, activeWing, safeInventory]);

    const availableTypes = React.useMemo(() => ['All', ...Array.from(new Set(inventoryForView.map(u => u.type)))], [inventoryForView]);

    const filteredInventory = React.useMemo(() => {
        return inventoryForView.filter(unit => {
            const typeMatch = typeFilter === 'All' || unit.type === typeFilter;
            const statusMatch = statusFilter === 'All' || unit.status === statusFilter;
            return typeMatch && statusMatch;
        });
    }, [inventoryForView, typeFilter, statusFilter]);

    const groupedInventory = filteredInventory.reduce((acc, unit) => {
        const floor = unit.floor;
        if (!acc[floor]) acc[floor] = [];
        acc[floor].push(unit);
        return acc;
    }, {} as Record<number, InventoryUnit[]>);

    const stats = React.useMemo(() => {
        const total = inventoryForView.length;
        const available = inventoryForView.filter(u => u.status === 'Available').length;
        const booked = inventoryForView.filter(u => u.status === 'Booked' || u.status === 'Sold').length;
        const potentialRev = inventoryForView.reduce((sum, u) => sum + u.price, 0);
        const soldRev = inventoryForView.filter(u => u.status === 'Booked' || u.status === 'Sold').reduce((sum, u) => sum + u.price, 0);
        
        return { total, available, booked, potentialRev, soldRev };
    }, [inventoryForView]);

    const sortedFloors = Object.keys(groupedInventory).map(Number).sort((a, b) => b - a);

    const formatCurrency = (val: number) => {
        if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
        if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
        return `₹${val.toLocaleString()}`;
    };
    
    const handleUnitSave = (updatedUnit: InventoryUnit) => {
        const newInventory = safeInventory.map(u => u.id === updatedUnit.id ? updatedUnit : u);
        onUpdateProject({ ...project, inventory: newInventory });
        setEditingUnit(null);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="mb-6 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-[var(--dark-bg)] p-3 rounded-lg border border-[var(--light-bg)]">
                        <p className="text-xs text-[var(--text-secondary)]">Total Units</p>
                        <p className="text-lg font-bold text-[var(--text-primary)]">{stats.total}</p>
                    </div>
                    <div className="bg-[var(--dark-bg)] p-3 rounded-lg border border-[var(--light-bg)]">
                        <p className="text-xs text-[var(--text-secondary)]">Available</p>
                        <p className="text-lg font-bold text-green-400">{stats.available} <span className="text-xs font-normal text-[var(--text-secondary)]">({stats.total > 0 ? ((stats.available/stats.total)*100).toFixed(0) : 0}%)</span></p>
                    </div>
                    <div className="bg-[var(--dark-bg)] p-3 rounded-lg border border-[var(--light-bg)]">
                        <p className="text-xs text-[var(--text-secondary)]">Potential Revenue</p>
                        <p className="text-lg font-bold text-blue-400">{formatCurrency(stats.potentialRev)}</p>
                    </div>
                    <div className="bg-[var(--dark-bg)] p-3 rounded-lg border border-[var(--light-bg)]">
                        <p className="text-xs text-[var(--text-secondary)]">Sold Revenue</p>
                        <p className="text-lg font-bold text-yellow-400">{formatCurrency(stats.soldRev)}</p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[var(--dark-bg)] p-3 rounded-lg border border-[var(--light-bg)]">
                    <div className="flex flex-1 items-center gap-4 overflow-x-auto w-full md:w-auto">
                        {hasWings && (
                            <div className="flex items-center border-r border-[var(--light-bg)] pr-4">
                                {project.wings!.map(wing => (
                                    <button
                                        key={wing}
                                        onClick={() => setActiveWing(wing)}
                                        className={`px-3 py-1.5 text-sm font-bold rounded-md transition-colors flex items-center gap-2 ${activeWing === wing ? 'bg-[var(--primary-color)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--medium-bg)]'}`}
                                    >
                                        Wing {wing}
                                        {activeWing === wing && (
                                            <i 
                                                className="fas fa-pencil-alt text-[10px] opacity-70 hover:opacity-100 ml-1" 
                                                title="Edit Wing Plan"
                                                onClick={(e) => { e.stopPropagation(); onOpenGenerateModal(wing); }}
                                            ></i>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                        <div className="flex gap-2">
                            <select 
                                value={typeFilter} 
                                onChange={(e) => setTypeFilter(e.target.value)} 
                                className="bg-[var(--medium-bg)] border border-[var(--light-bg)] text-[var(--text-primary)] text-sm rounded-md px-3 py-1.5 focus:outline-none focus:border-[var(--primary-color)]"
                            >
                                {availableTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <select 
                                value={statusFilter} 
                                onChange={(e) => setStatusFilter(e.target.value as any)} 
                                className="bg-[var(--medium-bg)] border border-[var(--light-bg)] text-[var(--text-primary)] text-sm rounded-md px-3 py-1.5 focus:outline-none focus:border-[var(--primary-color)]"
                            >
                                <option value="All">All Statuses</option>
                                <option value="Available">Available</option>
                                <option value="Booked">Booked</option>
                                <option value="Sold">Sold</option>
                                <option value="On Hold">On Hold</option>
                                <option value="Not for Sale">Not for Sale</option>
                            </select>
                        </div>
                    </div>
                    <button 
                        onClick={() => onOpenGenerateModal()} 
                        className="px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                    >
                        <i className="fas fa-plus"></i>
                        Generate Inventory
                    </button>
                </div>
            </div>

            {inventoryForView.length > 0 && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3 text-xs text-[var(--text-secondary)]" aria-label="Legend">
                    {(['Available', 'Booked', 'Sold', 'On Hold', 'Not for Sale'] as InventoryUnitStatus[]).map(st => (
                        <button key={st} type="button" onClick={() => setStatusFilter(statusFilter === st ? 'All' : st)} aria-pressed={statusFilter === st}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-[var(--dark-bg)] ${statusFilter === st ? 'bg-[var(--dark-bg)] text-[var(--text-primary)] font-semibold' : ''}`}>
                            <span className={`w-3 h-3 rounded-sm border ${getStatusColor(st)}`}></span>
                            {st} <b className="text-[var(--text-primary)]">{inventoryForView.filter(u => u.status === st).length}</b>
                        </button>
                    ))}
                </div>
            )}

            {inventoryForView.length > 0 ? (
                <div className="space-y-1 overflow-y-auto pr-2 pb-10 custom-scrollbar">
                    {sortedFloors.map(floorNum => {
                        const floorLabel = floorNum === 0 ? 'G' : floorNum < 0 ? `B${Math.abs(floorNum)}` : `${floorNum}`;
                        const units = groupedInventory[floorNum].sort((a,b) => a.unitNumber.localeCompare(b.unitNumber));
                        
                        return (
                            <div key={floorNum} className="flex items-stretch gap-3 group">
                                <div className="w-10 flex-shrink-0 flex items-center justify-center bg-[var(--dark-bg)] border border-[var(--light-bg)] rounded-l-md text-[var(--text-secondary)] font-bold text-sm shadow-sm group-hover:border-[var(--primary-color)] transition-colors">
                                    {floorLabel}
                                </div>
                                <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 p-2 bg-[var(--dark-bg)]/50 rounded-r-md border border-transparent group-hover:bg-[var(--dark-bg)] transition-colors">
                                    {units.map(unit => (
                                        <div 
                                            key={unit.id}
                                            role="button" tabIndex={0} aria-label={`Edit unit ${unit.unitNumber}, ${unit.status}`}
                                            onClick={() => setEditingUnit(unit)}
                                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEditingUnit(unit); } }}
                                            className={`relative p-2 rounded border shadow-sm transition-all hover:ring-2 hover:ring-white/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer ${getStatusColor(unit.status)}`}
                                            title={`Unit: ${unit.unitNumber} \nType: ${unit.type} \nPrice: ${formatCurrency(unit.price)} \nStatus: ${unit.status}`}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-bold text-sm truncate">{unit.unitNumber}</span>
                                                <span className="text-[10px] opacity-80 uppercase tracking-wider">{unit.type}</span>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <span className="text-[10px] opacity-75">{unit.area} sqft</span>
                                                <span className="text-[10px] font-bold">{formatCurrency(unit.price)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                 <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-secondary)] p-8 border-2 border-dashed border-[var(--light-bg)] rounded-xl">
                    <i className="fas fa-building text-5xl mb-4 text-[var(--light-bg)]"></i>
                    <p className="text-lg font-semibold">No Inventory Generated</p>
                    <p className="text-sm mt-2 mb-6">Set up your building structure to visualize the stacking plan.</p>
                    <button 
                        onClick={() => onOpenGenerateModal()} 
                        className="px-6 py-3 rounded-md bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-indigo-500/30"
                    >
                        Generate Inventory Now
                    </button>
                </div>
            )}
            
            {editingUnit && (
                <EditUnitModal 
                    isOpen={!!editingUnit} 
                    onClose={() => setEditingUnit(null)} 
                    unit={editingUnit} 
                    onSave={handleUnitSave} 
                />
            )}
        </div>
    );
  };

  const FloorPlanView: React.FC<{ project: Project; onUpdateProject: (p: Project) => void }> = ({ project, onUpdateProject }) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFloorPlanUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    onUpdateProject({ ...project, floorPlanUrl: reader.result });
                }
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleRemoveFloorPlan = () => {
        onUpdateProject({ ...project, floorPlanUrl: undefined });
    }

    return (
        <div className="max-w-4xl mx-auto p-4 bg-[var(--dark-bg)] rounded-lg">
            <input type="file" ref={fileInputRef} onChange={handleFloorPlanUpload} accept="image/*" className="hidden" />
            
            {project.floorPlanUrl ? (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold text-[var(--text-primary)]">Current Floor Plan</h4>
                        <div className="flex gap-2">
                             <button onClick={() => fileInputRef.current?.click()} className="text-sm px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white">Change</button>
                             <button onClick={handleRemoveFloorPlan} className="text-sm px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white">Remove</button>
                        </div>
                    </div>
                    <div className="border border-[var(--light-bg)] rounded-lg p-2 bg-[var(--medium-bg)]">
                        <img src={project.floorPlanUrl} alt="Floor Plan" className="w-full h-auto rounded-md object-contain" />
                    </div>
                </div>
            ) : (
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-[var(--border-color)] rounded-md cursor-pointer hover:border-[var(--primary-color)] hover:bg-[var(--light-bg)] transition-colors text-center"
                >
                    <i className="fas fa-map-marked-alt text-5xl mb-4 text-[var(--primary-color)]"></i>
                    <h4 className="text-lg font-semibold text-[var(--text-primary)]">No Floor Plan Uploaded</h4>
                    <p className="text-sm text-[var(--text-secondary)] mt-2">Click here to upload a floor plan image for this project.</p>
                </div>
            )}
        </div>
    );
};
  
  const ParkingView: React.FC<{ project: Project; onUpdateProject: (p: Project) => void }> = ({ project, onUpdateProject }) => {
    const hasWings = project.wings && project.wings.length > 0;
    const [activeWing, setActiveWing] = React.useState<string | null>(hasWings ? project.wings![0] : null);
    const [statusFilter, setStatusFilter] = React.useState<InventoryUnitStatus | 'All'>('All');
    const [levelFilter, setLevelFilter] = React.useState<string | 'All'>('All');
    const [editingSlot, setEditingSlot] = React.useState<ParkingSlot | null>(null);

    const safeParking = React.useMemo(() => project.parkingInventory || [], [project.parkingInventory]);

    const inventoryForView = React.useMemo(() => {
        if (!hasWings) {
            return safeParking;
        }
        if (!activeWing) return [];
        return safeParking.filter(slot => slot.slotNumber.includes(`-${activeWing}-`) || slot.slotNumber.startsWith(`P-${activeWing}`));
    }, [hasWings, activeWing, safeParking]);

    const filteredInventory = React.useMemo(() => {
        return inventoryForView.filter(slot => {
            const statusMatch = statusFilter === 'All' || slot.status === statusFilter;
            const levelMatch = levelFilter === 'All' || slot.level === levelFilter;
            return statusMatch && levelMatch;
        });
    }, [inventoryForView, statusFilter, levelFilter]);

    const groupedByLevel = React.useMemo(() => {
        const groups: Record<string, ParkingSlot[]> = {};
        filteredInventory.forEach(slot => {
            if (!groups[slot.level]) groups[slot.level] = [];
            groups[slot.level].push(slot);
        });
        return groups;
    }, [filteredInventory]);

    const sortedLevels = Object.keys(groupedByLevel).sort((a, b) => {
        const getLevelWeight = (lvl: string) => {
            if (lvl.startsWith('B')) return -parseInt(lvl.substring(1) || '0');
            if (lvl === 'G') return 0;
            if (lvl.startsWith('P')) return parseInt(lvl.substring(1) || '0') + 100;
            return 1000;
        };
        return getLevelWeight(a) - getLevelWeight(b);
    });

    const stats = React.useMemo(() => {
        const total = inventoryForView.length;
        const available = inventoryForView.filter(s => s.status === 'Available').length;
        const booked = total - available;
        const occupancy = total > 0 ? (booked / total) * 100 : 0;
        return { total, available, booked, occupancy };
    }, [inventoryForView]);

    const handleSlotSave = (updatedSlot: ParkingSlot) => {
        const newParking = safeParking.map(p => p.id === updatedSlot.id ? updatedSlot : p);
        onUpdateProject({ ...project, parkingInventory: newParking });
        setEditingSlot(null);
    };

    const getParkingColor = (status: InventoryUnitStatus) => {
         switch (status) {
            case 'Available': return 'border-green-500/50 bg-green-900/10 hover:bg-green-900/20';
            case 'Booked': return 'border-red-500/50 bg-red-900/10 hover:bg-red-900/20';
            case 'Sold': return 'border-gray-500/50 bg-gray-800/50 hover:bg-gray-800';
            default: return 'border-gray-600 bg-gray-800/20';
         }
    };

    const safeInventory = React.useMemo(() => project.inventory || [], [project.inventory]);

    return (
        <div className="flex flex-col h-full space-y-6">
             <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-3 bg-[var(--dark-bg)] p-4 rounded-lg border border-[var(--light-bg)] flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="flex gap-4 overflow-x-auto w-full sm:w-auto items-center">
                         {hasWings && (
                             <div className="flex gap-2 border-r border-[var(--light-bg)] pr-4">
                                 {project.wings!.map(wing => (
                                     <button
                                         key={wing}
                                         onClick={() => setActiveWing(wing)}
                                         className={`px-3 py-1.5 text-sm font-bold rounded transition-colors ${activeWing === wing ? 'bg-[var(--primary-color)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--medium-bg)]'}`}
                                     >
                                         Wing {wing}
                                     </button>
                                 ))}
                             </div>
                         )}
                        <div className="flex gap-2">
                            <select 
                                value={levelFilter} 
                                onChange={(e) => setLevelFilter(e.target.value)} 
                                className="bg-[var(--medium-bg)] border border-[var(--light-bg)] text-[var(--text-primary)] text-sm rounded px-3 py-1.5 focus:outline-none focus:border-[var(--primary-color)]"
                            >
                                <option value="All">All Levels</option>
                                {Array.from(new Set(safeParking.map(p => p.level))).sort().map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                            <select 
                                value={statusFilter} 
                                onChange={(e) => setStatusFilter(e.target.value as any)} 
                                className="bg-[var(--medium-bg)] border border-[var(--light-bg)] text-[var(--text-primary)] text-sm rounded px-3 py-1.5 focus:outline-none focus:border-[var(--primary-color)]"
                            >
                                <option value="All">All Statuses</option>
                                <option value="Available">Available</option>
                                <option value="Booked">Booked</option>
                                <option value="Sold">Sold</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-4 text-sm">
                        <div className="text-center"><p className="text-[var(--text-secondary)] text-xs">Total</p><p className="font-bold text-[var(--text-primary)]">{stats.total}</p></div>
                        <div className="text-center"><p className="text-[var(--text-secondary)] text-xs">Available</p><p className="font-bold text-green-400">{stats.available}</p></div>
                        <div className="text-center"><p className="text-[var(--text-secondary)] text-xs">Occupancy</p><p className="font-bold text-blue-400">{stats.occupancy.toFixed(0)}%</p></div>
                    </div>
                </div>
             </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {sortedLevels.length === 0 ? (
                    <div className="text-center text-[var(--text-secondary)] mt-10 p-8 bg-[var(--dark-bg)] rounded-lg border-2 border-dashed border-[var(--light-bg)]">
                        <i className="fas fa-car-side text-4xl mb-4 opacity-50"></i>
                        <p className="font-semibold">No parking inventory found.</p>
                        <p className="text-sm mt-1">Parking slots are created with Generate Inventory on the Stacking Plan tab.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {sortedLevels.map(level => (
                            <div key={level} className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg relative">
                                <div className="absolute -top-3 left-4 bg-gray-900 border border-gray-700 px-3 py-1 rounded-md text-xs font-bold text-gray-300 uppercase tracking-wider shadow-sm z-10">
                                    Level {level}
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3 pt-4">
                                    {groupedByLevel[level].map(slot => (
                                        <div 
                                            key={slot.id}
                                            onClick={() => setEditingSlot(slot)}
                                            className={`relative group cursor-pointer border-2 border-dashed rounded-md p-2 flex flex-col items-center justify-center h-24 transition-all ${getParkingColor(slot.status)}`}
                                        >
                                            <span className="text-xs font-bold text-gray-300 mb-1">{slot.slotNumber}</span>
                                            {slot.status === 'Available' ? (
                                                <div className="text-gray-600 opacity-30 text-2xl group-hover:opacity-50 transition-opacity">
                                                    <i className="fas fa-parking"></i>
                                                </div>
                                            ) : (
                                                <div className={`text-2xl ${slot.status === 'Booked' ? 'text-red-500' : 'text-gray-400'}`}>
                                                    <i className="fas fa-car-side"></i>
                                                </div>
                                            )}
                                            {slot.assignedUnitId && (
                                                <span className="absolute bottom-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                                                    Unit {safeInventory.find(u => u.id === slot.assignedUnitId)?.unitNumber || '?'}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

             {editingSlot && (
                <EditParkingModal 
                    isOpen={!!editingSlot}
                    onClose={() => setEditingSlot(null)}
                    slot={editingSlot}
                    onSave={handleSlotSave}
                />
            )}
        </div>
    );
  };

const ProjectInventory: React.FC<ProjectInventoryProps> = ({ project, paymentPlans, onUpdateProject, onDeleteProject, onBack }) => {
  const [activeTab, setActiveTab] = React.useState<'setup' | 'floor' | 'parking' | 'floorPlan'>('floor');
  const [showGenerateModal, setShowGenerateModal] = React.useState(false);
  const [editingWing, setEditingWing] = React.useState<string | undefined>(undefined);

  const safeProject = React.useMemo(() => ({
      ...project,
      inventory: project.inventory || [],
      parkingInventory: project.parkingInventory || []
  }), [project]);

  const handleOpenGenerateModal = (wing?: string) => {
      setEditingWing(wing);
      setShowGenerateModal(true);
  };
  
  return (
    <>
        <div className="flex flex-col h-full bg-[var(--medium-bg)] rounded-lg p-4">
            <div className="flex items-start gap-3 mb-4 flex-shrink-0">
                <button onClick={onBack} aria-label="Back to projects" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--light-bg)] transition-colors flex-shrink-0">
                    <i className="fas fa-arrow-left"></i>
                </button>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-bold text-[var(--text-primary)] truncate">{safeProject.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold text-white whitespace-nowrap ${safeProject.projectStatus === 'Ready to Move' ? 'bg-green-600' : safeProject.projectStatus === 'Under Construction' ? 'bg-yellow-600' : 'bg-blue-600'}`}>{safeProject.projectStatus}</span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">
                        {[safeProject.location, safeProject.companyName, safeProject.projectType, safeProject.reraNumber && `RERA ${safeProject.reraNumber}`].filter(Boolean).join(' · ')}
                    </p>
                </div>
            </div>

            <div className="border-b border-[var(--light-bg)] mb-4 flex-shrink-0">
                <nav className="flex space-x-1 overflow-x-auto" role="tablist">
                    <button onClick={() => setActiveTab('floor')} className={`py-2 px-4 text-sm font-medium flex items-center gap-2 ${activeTab === 'floor' ? 'text-[var(--primary-color)] border-b-2 border-[var(--primary-color)]' : 'text-[var(--text-secondary)] hover:text-[var(--primary-color)]'}`}>
                        <i className="fas fa-building"></i> Stacking Plan
                    </button>
                    <button onClick={() => setActiveTab('setup')} className={`py-2 px-4 text-sm font-medium flex items-center gap-2 ${activeTab === 'setup' ? 'text-[var(--primary-color)] border-b-2 border-[var(--primary-color)]' : 'text-[var(--text-secondary)] hover:text-[var(--primary-color)]'}`}>
                        <i className="fas fa-wrench"></i> Setup
                    </button>
                    <button onClick={() => setActiveTab('parking')} className={`py-2 px-4 text-sm font-medium flex items-center gap-2 ${activeTab === 'parking' ? 'text-[var(--primary-color)] border-b-2 border-[var(--primary-color)]' : 'text-[var(--text-secondary)] hover:text-[var(--primary-color)]'}`}>
                        <i className="fas fa-parking"></i> Parking
                    </button>
                    <button onClick={() => setActiveTab('floorPlan')} className={`py-2 px-4 text-sm font-medium flex items-center gap-2 ${activeTab === 'floorPlan' ? 'text-[var(--primary-color)] border-b-2 border-[var(--primary-color)]' : 'text-[var(--text-secondary)] hover:text-[var(--primary-color)]'}`}>
                        <i className="fas fa-map"></i> Floor Plan
                    </button>
                </nav>
            </div>
            
            <div className="flex-1 overflow-hidden p-1">
                <div className="h-full overflow-y-auto">
                    {activeTab === 'setup' && <SetupView project={safeProject} paymentPlans={paymentPlans} onUpdateProject={onUpdateProject} onDeleteProject={onDeleteProject} onBack={onBack} />}
                    {activeTab === 'floorPlan' && <FloorPlanView project={safeProject} onUpdateProject={onUpdateProject} />}
                    {activeTab === 'floor' && (safeProject.inventory.length > 0 ? <FloorInventoryView project={safeProject} onOpenGenerateModal={handleOpenGenerateModal} onUpdateProject={onUpdateProject} /> : (
                        <div className="text-center text-[var(--text-secondary)] mt-10 p-6 bg-[var(--dark-bg)] rounded-lg border-2 border-dashed border-[var(--light-bg)]">
                            <i className="fas fa-cubes text-4xl mb-4 text-[var(--primary-color)]"></i>
                            <p className="font-semibold text-lg">No Inventory Generated</p>
                            <p className="text-sm mt-2 mb-6">Set up your building structure to visualize the stacking plan.</p>
                            <button 
                                onClick={() => handleOpenGenerateModal()} 
                                className="px-6 py-3 rounded-md bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-indigo-500/30"
                            >
                                Generate Inventory Now
                            </button>
                        </div>
                    ))}
                    {activeTab === 'parking' && <ParkingView project={safeProject} onUpdateProject={onUpdateProject} />}
                </div>
            </div>
        </div>
        <GenerateInventoryModal
            isOpen={showGenerateModal}
            onClose={() => setShowGenerateModal(false)}
            project={safeProject}
            onGenerate={onUpdateProject}
            initialWing={editingWing}
        />
    </>
  );
};
export default ProjectInventory;
