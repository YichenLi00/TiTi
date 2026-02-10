import { useRef, memo } from 'react';
import { useTodoState, useTodoActions } from '../hooks/useTodo';
import { useProjectState, useProjectActions } from '../hooks/useProject';
import { exportData, importData } from '../utils/data';

interface SettingsModalProps {
  onClose: () => void;
}

const SettingsModal = memo(function SettingsModal({ onClose }: SettingsModalProps) {
  const { todos } = useTodoState();
  const { replaceTodos } = useTodoActions();
  const { projects } = useProjectState();
  const { replaceProjects } = useProjectActions();
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
          // eslint-disable-next-line no-console
          console.log('Data imported successfully!');
        } else {
          // eslint-disable-next-line no-console
          console.error('Failed to import data. Please check the file format.');
        }
        onClose();
      };
      reader.onerror = () => {
        // eslint-disable-next-line no-console
        console.error('Failed to read file');
        onClose();
      };
      reader.readAsText(file);
    }
    // 重置文件输入，允许再次导入同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
});

export { SettingsModal };
