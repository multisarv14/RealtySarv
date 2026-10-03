import React from 'react';
import { User, Project } from '../../types';
import { Modal } from '../ui/Modal';

interface AssignProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  projects: Project[];
  onAssignProjects: (userId: string, projectIds: string[]) => void;
}

const AssignProjectModal: React.FC<AssignProjectModalProps> = ({ isOpen, onClose, user, projects, onAssignProjects }) => {
  const [selected, setSelected] = React.useState<string[]>([]);

  React.useEffect(() => { if (isOpen && user) setSelected(user.assignedProjectIds || []); }, [isOpen, user]);

  const toggle = (id: string) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const allOn = projects.length > 0 && selected.length === projects.length;

  return (
    <Modal
      isOpen={isOpen} onClose={onClose} size="md" title="Assign projects" subtitle={user?.name}
      onSubmit={(e) => { e.preventDefault(); onAssignProjects(user.id, selected); onClose(); }}
      submitLabel="Save assignments"
    >
      {projects.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)] text-center py-4">No projects yet. Register a project first.</p>
      ) : (
        <>
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span>{selected.length} of {projects.length} selected</span>
            <button type="button" onClick={() => setSelected(allOn ? [] : projects.map(p => p.id))} className="font-semibold text-[var(--primary-color)] hover:underline">{allOn ? 'Clear all' : 'Select all'}</button>
          </div>
          <ul className="space-y-2" aria-label="Projects">
            {projects.map(p => {
              const on = selected.includes(p.id);
              return (
                <li key={p.id}>
                  <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${on ? 'border-[var(--primary-color)] bg-[color-mix(in_srgb,var(--primary-color)_12%,transparent)]' : 'border-[var(--border-color)] hover:bg-[var(--light-bg)]'}`}>
                    <input type="checkbox" checked={on} onChange={() => toggle(p.id)} className="h-4 w-4 accent-[var(--primary-color)]" />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-[var(--text-primary)] truncate">{p.name}</span>
                      <span className="block text-xs text-[var(--text-secondary)] truncate">{[p.location, p.projectStatus].filter(Boolean).join(' · ')}</span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Modal>
  );
};

export default AssignProjectModal;
