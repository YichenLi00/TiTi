import { useRef } from 'react';
import { useTodo } from '../hooks/useTodo';
import { useProject } from '../hooks/useProject';
import { exportData, importData } from '../utils/data';

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { todos, replaceTodos } = useTodo();
  const { projects, replaceProjects } = useProject();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = exportData(todos, projects);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `titi-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onClose();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const result = importData(content);
        if (result) {
          if (result.todos) replaceTodos(result.todos);
          if (result.projects) replaceProjects(result.projects);
          alert('Data imported successfully!');
        } else {
          alert('Failed to import data. Please check the file format.');
        }
        onClose();
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal settings-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Settings</h3>
        <div className="settings-section">
          <h4>Data Management</h4>
          <div className="settings-buttons">
            <button className="btn-secondary" onClick={handleExport}>
              <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
                <path d="M10 3v10M6 9l4 4 4-4M3 17h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Export Data
            </button>
            <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
              <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
                <path d="M10 13V3M6 7l4-4 4 4M3 17h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Import Data
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{ display: 'none' }}
            />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
