import { useState } from 'react';
import { format } from 'date-fns';
import { useApp } from '../hooks/useApp';
import { PRIORITY_COLORS } from '../constants';
import type { ViewMode, RecurrenceType } from '../types';
import './AddTodoForm.css';

interface AddTodoFormProps {
  defaultProjectId?: string;
  viewMode: ViewMode;
}

export function AddTodoForm({ defaultProjectId, viewMode }: AddTodoFormProps) {
  const { addTodo, projects } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const [dueDate, setDueDate] = useState(viewMode === 'today' ? todayStr : '');
  const [projectId, setProjectId] = useState(defaultProjectId || 'inbox');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      addTodo({
        title: title.trim(),
        description: description.trim() || undefined,
        completed: false,
        dueDate: dueDate || undefined,
        projectId,
        priority,
        recurrence,
      });
      setTitle('');
      setDescription('');
      setDueDate(viewMode === 'today' ? format(new Date(), 'yyyy-MM-dd') : '');
      setPriority('medium');
      setRecurrence('none');
      setIsExpanded(false);
    }
  };

  const handleQuickAdd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && title.trim()) {
      e.preventDefault();
      handleSubmit(e);
    }
    if (e.key === 'Escape') {
      setIsExpanded(false);
      setTitle('');
    }
  };

  return (
    <div className={`add-todo-form ${isExpanded ? 'expanded' : ''}`}>
      {!isExpanded ? (
        <button className="add-btn" onClick={() => setIsExpanded(true)}>
          <span className="add-icon">+</span>
          <span>Add Task</span>
        </button>
      ) : (
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="What needs to be done?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleQuickAdd}
            autoFocus
            className="title-input"
          />

          <textarea
            placeholder="Add description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="description-input"
            rows={2}
          />

          <div className="form-options">
            <div className="option-group">
              <label className="option-label">
                <span className="option-icon">📅</span>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
              </label>

              <label className="option-label">
                <span className="option-icon">📁</span>
                <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="priority-selector">
                <span className="option-icon">🚩</span>
                <button
                  type="button"
                  className={`priority-btn ${priority === 'low' ? 'active' : ''}`}
                  onClick={() => setPriority('low')}
                  style={{ '--priority-color': PRIORITY_COLORS.low } as React.CSSProperties}
                >
                  Low
                </button>
                <button
                  type="button"
                  className={`priority-btn ${priority === 'medium' ? 'active' : ''}`}
                  onClick={() => setPriority('medium')}
                  style={{ '--priority-color': PRIORITY_COLORS.medium } as React.CSSProperties}
                >
                  Med
                </button>
                <button
                  type="button"
                  className={`priority-btn ${priority === 'high' ? 'active' : ''}`}
                  onClick={() => setPriority('high')}
                  style={{ '--priority-color': PRIORITY_COLORS.high } as React.CSSProperties}
                >
                  High
                </button>
              </div>

              <label className="option-label">
                <span className="option-icon">🔁</span>
                <select value={recurrence} onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}>
                  <option value="none">No Repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </label>
            </div>

            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={() => setIsExpanded(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-submit" disabled={!title.trim()}>
                Add Task
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
