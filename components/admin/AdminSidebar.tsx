
import React from 'react';
import { AdminPanelSection } from '../../types';
import { ADMIN_PANEL_SECTIONS, AdminPanelSectionConfig } from '../../constants';

interface AdminSidebarProps {
  activeSection: AdminPanelSection | 'dashboard';
  onSelectSection: (section: AdminPanelSection | 'dashboard', subSection?: string) => void;
  activeSubSection: string | null;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeSection, onSelectSection, activeSubSection, onClose, isCollapsed, onToggleCollapse }) => {
  const [expandedSection, setExpandedSection] = React.useState<AdminPanelSection | null>(
    isCollapsed ? null : (ADMIN_PANEL_SECTIONS.find(s => s.subItems && s.id === activeSection)?.id as AdminPanelSection) || null
  );

  React.useEffect(() => {
    if (isCollapsed) {
      setExpandedSection(null);
    }
  }, [isCollapsed]);

  const handleSectionClick = (section: AdminPanelSectionConfig) => {
    if (isCollapsed) {
      onToggleCollapse?.();
      return;
    }

    if (section.subItems) {
      // Open the group when arriving from elsewhere; collapse only when clicking the group you are already in.
      setExpandedSection(prev => (prev === section.id && activeSection === section.id ? null : (section.id as AdminPanelSection)));
      // If expanding a new section, and it wasn't the active one, switch to it
      if (activeSection !== section.id) {
          onSelectSection(section.id as AdminPanelSection);
      }
    } else {
      onSelectSection(section.id as AdminPanelSection);
      onClose?.(); 
    }
  };
  
  const handleSubItemClick = (sectionId: AdminPanelSection | 'dashboard', subId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      onSelectSection(sectionId, subId);
      onClose?.(); 
  }

  return (
    <div className="w-full bg-[var(--medium-bg)] border-r border-[var(--border-color)] flex flex-col p-3 h-full overflow-hidden shadow-2xl z-30">
      <div className={`flex items-center mb-6 h-8 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-widest animate-fadeIn">Control Center</h2>}
        {isCollapsed && <i className="fas fa-shield-alt text-lg text-[var(--primary-color)]"></i>}
        {onClose && !isCollapsed && <button onClick={onClose} className="text-[var(--text-secondary)] p-2 md:hidden"><i className="fas fa-times"></i></button>}
      </div>
      <nav className="flex-1 overflow-y-auto -mr-3 pr-3 custom-scrollbar">
        <ul className="space-y-0.5">
          {ADMIN_PANEL_SECTIONS.map((section) => (
            <li key={section.id}>
              <button
                className={`w-full text-left p-2.5 rounded-md flex items-center justify-between gap-3 transition-all text-xs font-semibold uppercase tracking-wider ${
                  (activeSection === section.id && !section.subItems)
                    ? 'bg-[var(--primary-color)] text-white shadow-md'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--light-bg)] hover:text-[var(--text-primary)]'
                } ${activeSection === section.id && section.subItems ? 'text-[var(--primary-color)]' : ''} `}
                onClick={() => handleSectionClick(section)}
              >
                <div className={`flex items-center gap-3 ${isCollapsed ? 'w-full justify-center' : ''}`}>
                  <i className={`${section.icon} text-base w-5 text-center`} aria-hidden="true"></i>
                  {!isCollapsed && <span className="whitespace-nowrap">{section.label}</span>}
                </div>
                {!isCollapsed && section.subItems && (
                  <i className={`fas fa-chevron-right transition-transform text-[8px] ${expandedSection === section.id ? 'rotate-90' : ''}`} aria-hidden="true"></i>
                )}
              </button>
              {!isCollapsed && section.subItems && expandedSection === section.id && (
                <ul className="pl-6 pt-1 space-y-0.5 animate-fadeIn">
                  {section.subItems.map(subItem => (
                    <li key={subItem.id}>
                      <button
                        className={`w-full text-left p-2 rounded-md flex items-center gap-3 transition-colors text-[11px] font-medium ${
                            activeSection === section.id && activeSubSection === subItem.id
                            ? 'text-[var(--primary-color)] bg-[var(--primary-color)]/5 border-l-2 border-[var(--primary-color)]'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                        onClick={(e) => handleSubItemClick(section.id as AdminPanelSection, subItem.id, e)}
                      >
                        <i className={`${subItem.icon} w-4 text-center opacity-70`} aria-hidden="true"></i>
                        {subItem.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default AdminSidebar;
