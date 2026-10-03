
import React from 'react';
import NewGenericSettingModal from './NewGenericSettingModal';
import { UserRoleSetting } from '../../types';
import { confirmDialog } from '../ui/Confirm';
import { toast } from '../ui/Toast';
import { SHOW_DELETE } from '../../features';

interface Item {
  id: string;
  name: string;
  description?: string;
}

interface AdminGenericSettingManagementProps {
  title: string;
  itemNoun: string;
  items: Item[];
  onUpdateItems: (updatedItems: Item[]) => void;
  onAddItem: (itemData: { name: string; description?: string }) => void;
}

const AdminGenericSettingManagement: React.FC<AdminGenericSettingManagementProps> = ({ title, itemNoun, items, onUpdateItems, onAddItem }) => {
  const [showNewItemModal, setShowNewItemModal] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<Item | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');

  const safeItems = React.useMemo(() => items || [], [items]);

  const filteredItems = React.useMemo(() => {
    if (!searchTerm) return safeItems;
    return safeItems.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [safeItems, searchTerm]);

  const handleDeleteItem = async (itemId: string) => {
    if (await confirmDialog({ title: `Delete this ${itemNoun.toLowerCase()}?`, message: 'This cannot be undone.', confirmLabel: 'Delete', danger: true })) {
      const updatedItems = safeItems.filter(item => item.id !== itemId);
      onUpdateItems(updatedItems);
    }
  };

  return (
    <div className="p-4 bg-[var(--medium-bg)] rounded-lg shadow-md h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-[var(--text-primary)]">{title}</h3>
        <button
          onClick={() => setShowNewItemModal(true)}
          className="px-4 py-2 rounded-md bg-[var(--primary-color)] text-white font-medium hover:bg-[#128c7e] transition-colors flex items-center gap-2"
        >
          <i className="fas fa-plus-circle"></i> Add New {itemNoun}
        </button>
      </div>
      
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder={`Search by name or description...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 pl-10 rounded-md border border-[var(--light-bg)] bg-[var(--dark-bg)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary-color)]"
            aria-label={`Search ${itemNoun}s`}
          />
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"></i>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--light-bg)]">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">{itemNoun} Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--light-bg)]">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-8 text-[var(--text-secondary)]">
                    {searchTerm ? `No ${itemNoun.toLowerCase()}s match your search.` : `No ${itemNoun.toLowerCase()}s defined yet.`}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[var(--dark-bg)] transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-[var(--text-primary)]">{item.name}</td>
                    <td className="px-4 py-4 text-sm text-[var(--text-secondary)]">{item.description || 'N/A'}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingItem(item)}
                          className="text-sm px-3 py-1 rounded-md bg-blue-500 hover:bg-blue-600 text-white"
                          aria-label={`Edit ${item.name}`}
                        >
                          Edit
                        </button>
                        {SHOW_DELETE && (<button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-sm px-3 py-1 rounded-md bg-red-500 hover:bg-red-600 text-white"
                          aria-label={`Delete ${item.name}`}
                        >
                          Delete
                        </button>)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <NewGenericSettingModal
        isOpen={showNewItemModal || !!editingItem}
        onClose={() => { setShowNewItemModal(false); setEditingItem(null); }}
        onAddItem={onAddItem}
        initial={editingItem}
        onSave={(data) => { if (editingItem) onUpdateItems(safeItems.map(i => i.id === editingItem.id ? { ...i, ...data } : i)); }}
        title={`Add New ${itemNoun}`}
        itemNoun={itemNoun}
      />

    </div>
  );
};

export default AdminGenericSettingManagement;
