import { useState, memo } from 'react';
import { useProjectActions } from '../hooks/useProject';
import { PROJECT_COLORS } from '../constants';

interface AddProjectModalProps {
  parentProjectId?: string;
  onClose: () => void;
}

const AddProjectModal = memo(function AddProjectModal({ parentProjectId, onClose }: AddProjectModalProps) {
  const { addProject } = useProjectActions();
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PROJECT_COLORS[0]);

  const handleAdd = () => {
    const trimmedName = name.trim();
    if (trimmedName) {
      addProject({
        name: trimmedName,
        color: selectedColor,
        parentId: parentProjectId,
      });
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{parentProjectId ? 'New Subproject' : 'New Project'}</h3>
        <input
          type="text"
          placeholder="Project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          onKeyDown={handleKeyDown}
        />
        <div className="color-picker">
          {PROJECT_COLORS.map((color) => (
            <button
              key={color}
              className={`color-option ${selectedColor === color ? 'selected' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => setSelectedColor(color)}
            />
          ))}
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleAdd}>
            Add
          </button>
        </div>
      </div>
    </div>
  );
});

export { AddProjectModal };
