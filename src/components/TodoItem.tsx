import { useState, useRef, useEffect } from 'react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import type { Todo } from '../types';
import { useApp } from '../hooks/useApp';
import { PRIORITY_COLORS } from '../constants';
import './TodoItem.css';

interface TodoItemProps {
  todo: Todo;
  level?: number;
}

export function TodoItem({ todo, level = 0 }: TodoItemProps) {
  const { toggleTodo, deleteTodo, updateTodo, addTodo, extendTodo, projects, getSubtasks } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [showExtendMenu, setShowExtendMenu] = useState(false);
  const extendMenuRef = useRef<HTMLDivElement>(null);

  const project = projects.find((p) => p.id === todo.projectId);
  const subtasks = getSubtasks(todo.id);
  const hasSubtasks = subtasks.length > 0;
  const completedSubtasks = subtasks.filter((s) => s.completed).length;

  // Close extend menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (extendMenuRef.current && !extendMenuRef.current.contains(event.target as Node)) {
        setShowExtendMenu(false);
      }
    };

    if (showExtendMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExtendMenu]);

  const formatDueDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d');
  };

  const getDueDateClass = () => {
    if (!todo.dueDate) return '';
    const date = new Date(todo.dueDate);
    if (isPast(date) && !isToday(date) && !todo.completed) return 'overdue';
    if (isToday(date)) return 'today';
    return '';
  };

  const handleSave = () => {
    if (editTitle.trim()) {
      updateTodo(todo.id, { title: editTitle.trim() });
    }
    setIsEditing(false);
  };

  const handleAddSubtask = () => {
    if (subtaskTitle.trim()) {
      addTodo({
        title: subtaskTitle.trim(),
        completed: false,
        projectId: todo.projectId,
        priority: 'medium',
        parentId: todo.id,
        recurrence: 'none',
      });
      setSubtaskTitle('');
      setIsAddingSubtask(false);
    }
  };

  const handleExtend = (days: number) => {
    extendTodo(todo.id, days);
    setShowExtendMenu(false);
  };

  // Don't render subtasks at root level (they'll be rendered under their parent)
  if (todo.parentId && level === 0) {
    return null;
  }

  return (
    <div className={`todo-item-wrapper ${level > 0 ? 'subtask' : ''}`}>
      <div className={`todo-item ${todo.completed ? 'completed' : ''}`} style={{ marginLeft: level * 24 }}>
        {hasSubtasks && (
          <button
            className={`expand-btn ${isExpanded ? 'expanded' : ''}`}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <svg viewBox="0 0 10 10" fill="none">
              <path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}

        <button
          className="checkbox"
          onClick={() => toggleTodo(todo.id)}
          style={{ borderColor: PRIORITY_COLORS[todo.priority] }}
        >
          {todo.completed && (
            <svg viewBox="0 0 14 14" fill="none">
              <path
                d="M3 7l3 3 5-6"
                stroke={PRIORITY_COLORS[todo.priority]}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>

        <div className="todo-content">
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') {
                  setEditTitle(todo.title);
                  setIsEditing(false);
                }
              }}
              autoFocus
              className="edit-input"
            />
          ) : (
            <span className="todo-title" onDoubleClick={() => setIsEditing(true)}>
              {todo.title}
            </span>
          )}

          <div className="todo-meta">
            {project && project.id !== 'inbox' && level === 0 && (
              <span className="todo-project" style={{ color: project.color }}>
                <span className="project-indicator" style={{ backgroundColor: project.color }} />
                {project.name}
              </span>
            )}
            {todo.dueDate && (
              <span className={`todo-due-date ${getDueDateClass()}`}>
                {formatDueDate(todo.dueDate)}
              </span>
            )}
            {todo.recurrence && todo.recurrence !== 'none' && (
              <span className="todo-recurrence">
                🔁 {todo.recurrence}
              </span>
            )}
            {hasSubtasks && (
              <span className="subtask-count">
                {completedSubtasks}/{subtasks.length}
              </span>
            )}
          </div>
        </div>

        <div className="todo-actions">
          {!todo.completed && (
            <div className="extend-wrapper" ref={extendMenuRef}>
              <button
                className="extend-btn"
                onClick={() => setShowExtendMenu(!showExtendMenu)}
                title="Extend deadline"
              >
                <svg viewBox="0 0 20 20" fill="none">
                  <path d="M10 4v8l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M14 2l2 2M6 2L4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
              {showExtendMenu && (
                <div className="extend-menu">
                  <div className="extend-menu-title">Extend by</div>
                  {[1, 2, 3, 4, 5, 6, 7].map((days) => (
                    <button
                      key={days}
                      className="extend-option"
                      onClick={() => handleExtend(days)}
                    >
                      {days} {days === 1 ? 'day' : 'days'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {level === 0 && (
            <button
              className="add-subtask-btn"
              onClick={() => setIsAddingSubtask(true)}
              title="Add subtask"
            >
              <svg viewBox="0 0 20 20" fill="none">
                <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          )}
          <button className="delete-btn" onClick={() => deleteTodo(todo.id)}>
            <svg viewBox="0 0 20 20" fill="none">
              <path
                d="M6 6l8 8M14 6l-8 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {isAddingSubtask && (
        <div className="add-subtask-form" style={{ marginLeft: (level + 1) * 24 + 36 }}>
          <input
            type="text"
            placeholder="Subtask title..."
            value={subtaskTitle}
            onChange={(e) => setSubtaskTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddSubtask();
              if (e.key === 'Escape') {
                setSubtaskTitle('');
                setIsAddingSubtask(false);
              }
            }}
            autoFocus
          />
          <button className="btn-add" onClick={handleAddSubtask}>Add</button>
          <button className="btn-cancel" onClick={() => setIsAddingSubtask(false)}>Cancel</button>
        </div>
      )}

      {isExpanded && hasSubtasks && (
        <div className="subtasks-list">
          {subtasks.map((subtask) => (
            <TodoItem key={subtask.id} todo={subtask} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
