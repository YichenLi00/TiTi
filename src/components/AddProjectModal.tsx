import { useState } from 'react';
import { useApp } from '../hooks/useApp';
import { PROJECT_COLORS } from '../constants';

interface AddProjectModalProps {
  parentProjectId?: string;
  onClose: () => void;
}

export function AddProjectModal({ parentProjectId, onClose }: AddProjectModalProps) {
  const { addProject } = useApp();
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PROJECT_COLORS[0]);

  const handleAdd = () => {
    if (name.trim()) {
      addProject({
        name: name.trim(),
        color: selectedColor,
        parentId: parentProjectId,
      });
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
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
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
}
