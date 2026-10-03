


import React from 'react';
import { PaymentPlan, PaymentPlanMilestone } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { confirmDialog } from '../ui/Confirm';
import { toast } from '../ui/Toast';
import { SHOW_DELETE } from '../../features';

interface AdminPaymentPlanManagementProps {
  plans: PaymentPlan[];
  onUpdatePlans: (updatedPlans: PaymentPlan[]) => void;
  onDeletePlan: (planId: string) => void;
}

const AdminPaymentPlanManagement: React.FC<AdminPaymentPlanManagementProps> = ({ plans, onUpdatePlans, onDeletePlan }) => {
  const [selectedPlanId, setSelectedPlanId] = React.useState<string | null>(plans.length > 0 ? plans[0].id : null);
  
  const selectedPlan = React.useMemo(() => plans.find(p => p.id === selectedPlanId), [plans, selectedPlanId]);

  const handleAddPlan = () => {
    const newPlan: PaymentPlan = {
      id: uuidv4(),
      name: `New Payment Plan ${plans.length + 1}`,
      milestones: [{ id: uuidv4(), name: 'On Booking', percentage: 100 }],
    };
    onUpdatePlans([...plans, newPlan]);
    setSelectedPlanId(newPlan.id);
  };

  const handleDeletePlan = async (planId: string) => {
    if (await confirmDialog({ title: 'Delete payment plan?', message: 'Bookings already using it keep their schedule.', confirmLabel: 'Delete', danger: true })) {
      onDeletePlan(planId);
      if (selectedPlanId === planId) {
        setSelectedPlanId(null);
      }
    }
  };

  const handlePlanNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedPlan) return;
    const updatedPlans = plans.map(p => p.id === selectedPlan.id ? { ...p, name: e.target.value } : p);
    onUpdatePlans(updatedPlans);
  };

  const handleMilestoneChange = (milestoneId: string, field: 'name' | 'percentage' | 'achievedDate', value: string | number) => {
    if (!selectedPlan) return;
    const updatedMilestones = selectedPlan.milestones.map(m => 
      m.id === milestoneId 
        ? { ...m, [field]: field === 'percentage' ? (Number(value) || 0) : value } 
        : m
    );
    const updatedPlans = plans.map(p => p.id === selectedPlan.id ? { ...p, milestones: updatedMilestones } : p);
    onUpdatePlans(updatedPlans);
  };

  const handleAddMilestone = () => {
    if (!selectedPlan) return;
    const newMilestone: PaymentPlanMilestone = { id: uuidv4(), name: 'New Milestone', percentage: 0 };
    const updatedPlans = plans.map(p => p.id === selectedPlan.id ? { ...p, milestones: [...p.milestones, newMilestone] } : p);
    onUpdatePlans(updatedPlans);
  };
  
  const handleRemoveMilestone = (milestoneId: string) => {
    if (!selectedPlan || selectedPlan.milestones.length <= 1) {
        toast.error("A plan must have at least one milestone.");
        return;
    };
    const updatedMilestones = selectedPlan.milestones.filter(m => m.id !== milestoneId);
    const updatedPlans = plans.map(p => p.id === selectedPlan.id ? { ...p, milestones: updatedMilestones } : p);
    onUpdatePlans(updatedPlans);
  }

  const totalPercentage = selectedPlan?.milestones.reduce((sum, m) => sum + m.percentage, 0) || 0;

  return (
    <div className="h-full flex flex-col md:flex-row gap-6">
      {/* Plan List */}
      <div className="w-full md:w-1/3 flex flex-col bg-[var(--dark-bg)] p-4 rounded-lg border border-[var(--light-bg)]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-[var(--text-primary)]">Payment plans</h3>
          <button onClick={handleAddPlan} className="p-2 rounded-full text-sm text-[var(--text-primary)] bg-[var(--light-bg)] hover:bg-[var(--primary-color)]" title="Add New Plan">
            <i className="fas fa-plus"></i>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {plans.map(plan => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlanId(plan.id)}
              className={`w-full text-left p-3 rounded-md text-sm transition-colors ${
                selectedPlanId === plan.id ? 'bg-[var(--primary-color)] text-white font-semibold' : 'bg-[var(--medium-bg)] text-[var(--text-secondary)] hover:bg-[var(--light-bg)]'
              }`}
            >
              {plan.name}
            </button>
          ))}
          {plans.length === 0 && <p className="text-center text-xs text-[var(--text-secondary)] italic">No payment plans created yet.</p>}
        </div>
      </div>

      {/* Plan Details */}
      <div className="w-full md:w-2/3 flex flex-col bg-[var(--dark-bg)] p-4 rounded-lg border border-[var(--light-bg)]">
        {selectedPlan ? (
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <input
                type="text"
                value={selectedPlan.name}
                onChange={handlePlanNameChange}
                className="text-xl font-bold text-[var(--text-primary)] bg-transparent border-b-2 border-[var(--light-bg)] focus:border-[var(--primary-color)] focus:outline-none"
              />
              {SHOW_DELETE && <button onClick={() => handleDeletePlan(selectedPlan.id)} className="text-red-500 hover:text-red-400 p-2 rounded-full hover:bg-[var(--light-bg)]" title="Delete Plan">
                <i className="fas fa-trash-alt"></i>
              </button>}
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-[var(--light-bg)]">
                            <th className="py-2 text-left font-medium text-[var(--text-secondary)]">Milestone Name</th>
                            <th className="py-2 text-left font-medium text-[var(--text-secondary)] w-24">Percentage (%)</th>
                            <th className="py-2 text-left font-medium text-[var(--text-secondary)] w-32">Achieved Date</th>
                            <th className="py-2 text-left font-medium text-[var(--text-secondary)] w-32">Status</th>
                            <th className="w-10"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {selectedPlan.milestones.map(milestone => (
                            <tr key={milestone.id} className="border-b border-[var(--medium-bg)]">
                                <td className="py-2">
                                    <input type="text" value={milestone.name} onChange={e => handleMilestoneChange(milestone.id, 'name', e.target.value)} className="w-full bg-transparent p-1 rounded-md focus:bg-[var(--medium-bg)] focus:outline-none" />
                                </td>
                                <td className="py-2">
                                    <input type="number" value={milestone.percentage} onChange={e => handleMilestoneChange(milestone.id, 'percentage', e.target.value)} min="0" max="100" className="w-full bg-transparent p-1 rounded-md focus:bg-[var(--medium-bg)] focus:outline-none" />
                                </td>
                                <td className="py-2">
                                    <input type="date" value={milestone.achievedDate || ''} onChange={e => handleMilestoneChange(milestone.id, 'achievedDate', e.target.value)} className="w-full bg-transparent p-1 rounded-md focus:bg-[var(--medium-bg)] focus:outline-none" />
                                </td>
                                <td className="py-2">
                                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${milestone.achievedDate ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                        {milestone.achievedDate ? 'Completed' : 'Under Construction'}
                                    </span>
                                </td>
                                <td className="py-2 text-center">
                                    <button onClick={() => handleRemoveMilestone(milestone.id)} className="text-red-500 hover:text-red-400 text-xs p-1"><i className="fas fa-times"></i></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 <button onClick={handleAddMilestone} className="mt-4 text-xs px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white">+ Add Milestone</button>
            </div>

            <div className={`mt-4 pt-4 border-t border-[var(--light-bg)] flex justify-end items-center gap-4 font-bold text-lg ${totalPercentage === 100 ? 'text-green-500' : 'text-red-500'}`}>
              <span>Total:</span>
              <span>{totalPercentage}%</span>
              {totalPercentage !== 100 && <i className="fas fa-exclamation-triangle" title="Total must be 100%"></i>}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-center text-[var(--text-secondary)]">
            <div>
                <i className="fas fa-percent text-5xl mb-4"></i>
                <p>Select a payment plan to view its details, or add a new one to get started.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPaymentPlanManagement;