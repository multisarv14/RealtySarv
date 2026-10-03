
import React from 'react';
import { Source, NewSourceData } from '../../types';
import NewSourceModal from './NewSourceModal';
import { confirmDialog } from '../ui/Confirm';
import { toast } from '../ui/Toast';
import { SHOW_DELETE } from '../../features';

interface AdminSourceManagementProps {
  sources: Source[];
  onUpdateSources: (updatedSources: Source[]) => void;
  onAddSource: (sourceData: NewSourceData) => void;
}

const AdminSourceManagement: React.FC<AdminSourceManagementProps> = ({ sources, onUpdateSources, onAddSource }) => {
  const [showNewSourceModal, setShowNewSourceModal] = React.useState(false);
  const [editingSource, setEditingSource] = React.useState<Source | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [expandedChannels, setExpandedChannels] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    // Expand all channels by default on initial load
    const initialExpanded: Record<string, boolean> = {};
    const safeSources = sources || [];
    const uniqueChannels = Array.from(new Set(safeSources.map(source => source.channelSource)));
    uniqueChannels.forEach(channel => {
      initialExpanded[channel as string] = true;
    });
    setExpandedChannels(initialExpanded);
  }, [sources]);

  const filteredSources = React.useMemo(() => {
    const safeSources = sources || [];
    if (!searchTerm) {
      return safeSources;
    }
    return safeSources.filter(source =>
      source.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      source.channelSource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (source.description && source.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [sources, searchTerm]);

  const groupedSources = React.useMemo(() => {
    const groups: Record<string, Source[]> = {};
    (filteredSources || []).forEach(source => {
      const channel = source.channelSource || 'Unspecified Channel';
      if (!groups[channel]) {
        groups[channel] = [];
      }
      groups[channel].push(source);
    });
    return groups;
  }, [filteredSources]);

  const handleDeleteSource = React.useCallback(async (sourceId: string) => {
    const safeSources = sources || [];
    if (await confirmDialog({ title: 'Delete this source?', message: 'This cannot be undone.', confirmLabel: 'Delete', danger: true })) {
      const updatedSources = safeSources.filter(source => source.id !== sourceId);
      onUpdateSources(updatedSources);
      toast.success('Source deleted.');
    }
  }, [sources, onUpdateSources]);

  const toggleChannelExpansion = React.useCallback((channelName: string) => {
    setExpandedChannels(prev => ({
      ...prev,
      [channelName]: !prev[channelName],
    }));
  }, []);

  return (
    <div className="p-4 bg-[var(--medium-bg)] rounded-lg shadow-md h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-[var(--text-primary)]">Source Management</h3>
        <button
          onClick={() => setShowNewSourceModal(true)}
          className="px-4 py-2 rounded-md bg-[var(--primary-color)] text-white font-medium hover:bg-[#128c7e] transition-colors flex items-center gap-2"
        >
          <i className="fas fa-plus-circle"></i> Add New Source
        </button>
      </div>
      
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by channel, name, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 pl-10 rounded-md border border-[var(--light-bg)] bg-[var(--dark-bg)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary-color)]"
            aria-label="Search sources"
          />
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"></i>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {(Object.keys(groupedSources) as string[]).length === 0 ? (
          <p className="text-[var(--text-secondary)] text-center mt-8">
            {searchTerm ? 'No sources match your search.' : 'No lead sources defined yet.'}
          </p>
        ) : (
          (Object.entries(groupedSources) as [string, Source[]][]).map(([channelName, sourcesInGroup]) => (
            <div key={channelName} className="border border-[var(--light-bg)] rounded-md">
              <button
                onClick={() => toggleChannelExpansion(channelName)}
                className="w-full text-left p-4 bg-[var(--light-bg)] hover:bg-[var(--dark-bg)] transition-colors flex justify-between items-center text-lg font-semibold text-[var(--text-primary)]"
                aria-expanded={expandedChannels[channelName]}
              >
                {channelName} ({sourcesInGroup.length})
                <i className={`fas ${expandedChannels[channelName] ? 'fa-chevron-up' : 'fa-chevron-down'} text-sm text-[var(--text-secondary)]`}></i>
              </button>
              {expandedChannels[channelName] && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-[var(--dark-bg)]">
                    <thead className="bg-[var(--dark-bg)]">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Source Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Details</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--dark-bg)]">
                      {sourcesInGroup.map((source) => (
                        <tr key={source.id} className="hover:bg-[var(--dark-bg)] transition-colors">
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-[var(--text-primary)]">{source.name}</td>
                          <td className="px-4 py-4 text-sm text-[var(--text-secondary)]">{source.description || 'N/A'}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setEditingSource(source)}
                                className="text-sm px-3 py-1 rounded-md bg-blue-500 hover:bg-blue-600 text-white"
                                aria-label={`Edit ${source.name}`}
                              >
                                Edit
                              </button>
                              {SHOW_DELETE && (<button
                                onClick={() => handleDeleteSource(source.id)}
                                className="text-sm px-3 py-1 rounded-md bg-red-500 hover:bg-red-600 text-white"
                                aria-label={`Delete ${source.name}`}
                              >
                                Delete
                              </button>)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <NewSourceModal isOpen={showNewSourceModal || !!editingSource} onClose={() => { setShowNewSourceModal(false); setEditingSource(null); }} onAddSource={onAddSource} sources={sources || []} initial={editingSource} onSave={(data) => { if (editingSource) onUpdateSources((sources || []).map(s => s.id === editingSource.id ? { ...s, ...data } : s)); }} />
    </div>
  );
};

export default AdminSourceManagement;
