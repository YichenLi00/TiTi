import { useState } from 'react';
import { useProject } from '../hooks/useProject';
import { useView } from '../hooks/useView';
import { useTodo } from '../hooks/useTodo';
import { SettingsModal } from './SettingsModal';
import { AddProjectModal } from './AddProjectModal';
import type { Project } from '../types';
import './Sidebar.css';

export function Sidebar() {
  const { projects, getSubprojects, deleteProject } = useProject();
  const { viewMode, setViewMode, selectedProjectId, setSelectedProjectId, searchQuery, setSearchQuery } = useView();
  const { overdueTodos, noDateTodos, highPriorityTodos } = useTodo();

  const [addProjectParentId, setAddProjectParentId] = useState<string | undefined>(undefined);
  const [showAddProject, setShowAddProject] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const rootProjects = projects.filter((p) => !p.parentId);
  const overdueCount = overdueTodos.length;
  const noDateCount = noDateTodos.length;
  const highPriorityCount = highPriorityTodos.length;

  const handleProjectClick = (project: Project) => {
    setSelectedProjectId(project.id);
    setViewMode('project');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim()) {
      setViewMode('search');
    } else if (viewMode === 'search') {
      setViewMode('today');
    }
  };

  const openAddProject = (parentId?: string) => {
    setAddProjectParentId(parentId);
    setShowAddProject(true);
  };

  const renderProject = (project: Project, level: number = 0) => {
    const subprojects = getSubprojects(project.id);
    const isSelected = selectedProjectId === project.id && viewMode === 'project';

    return (
      <div key={project.id}>
        <div
          className={`sidebar-item project-item ${isSelected ? 'active' : ''}`}
          style={{ paddingLeft: `${16 + level * 16}px` }}
          onClick={() => handleProjectClick(project)}
        >
          <span className="project-dot" style={{ backgroundColor: project.color }} />
          <span className="project-name">{project.name}</span>
          {project.id !== 'inbox' && (
            <div className="project-actions">
              <button
                className="action-btn add-sub"
                onClick={(e) => {
                  e.stopPropagation();
                  openAddProject(project.id);
                }}
                title="Add subproject"
              >
                +
              </button>
              <button
                className="action-btn delete"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteProject(project.id);
                }}
                title="Delete project"
              >
                ×
              </button>
            </div>
          )}
        </div>
        {subprojects.map((sub) => renderProject(sub, level + 1))}
      </div>
    );
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="app-title">TiTi</h1>
        <button
          className="settings-btn"
          onClick={() => setShowSettings(!showSettings)}
          title="Settings"
        >
          <svg viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="2" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M10 1v2M10 17v2M1 10h2M17 10h2M3.5 3.5l1.4 1.4M15.1 15.1l1.4 1.4M3.5 16.5l1.4-1.4M15.1 4.9l1.4-1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <div className="search-container">
        <svg className="search-icon" viewBox="0 0 20 20" fill="none">
          <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="search-input"
        />
        {searchQuery && (
          <button
            className="search-clear"
            onClick={() => {
              setSearchQuery('');
              if (viewMode === 'search') setViewMode('today');
            }}
          >
            ×
          </button>
        )}
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <h2 className="nav-section-title">Views</h2>
          <button
            className={`sidebar-item ${viewMode === 'today' ? 'active' : ''}`}
            onClick={() => setViewMode('today')}
          >
            <span className="nav-icon">☀️</span>
            Today
          </button>
          <button
            className={`sidebar-item ${viewMode === 'upcoming' ? 'active' : ''}`}
            onClick={() => setViewMode('upcoming')}
          >
            <span className="nav-icon">📅</span>
            Upcoming
          </button>
          <button
            className={`sidebar-item ${viewMode === 'all' ? 'active' : ''}`}
            onClick={() => setViewMode('all')}
          >
            <span className="nav-icon">📋</span>
            All Tasks
          </button>
          <button
            className={`sidebar-item ${viewMode === 'calendar' ? 'active' : ''}`}
            onClick={() => setViewMode('calendar')}
          >
            <span className="nav-icon">🗓️</span>
            Calendar
          </button>
        </div>

        <div className="nav-section">
          <h2 className="nav-section-title">Smart Lists</h2>
          <button
            className={`sidebar-item ${viewMode === 'overdue' ? 'active' : ''}`}
            onClick={() => setViewMode('overdue')}
          >
            <span className="nav-icon">⚠️</span>
            Overdue
            {overdueCount > 0 && <span className="badge danger">{overdueCount}</span>}
          </button>
          <button
            className={`sidebar-item ${viewMode === 'high-priority' ? 'active' : ''}`}
            onClick={() => setViewMode('high-priority')}
          >
            <span className="nav-icon">🔥</span>
            High Priority
            {highPriorityCount > 0 && <span className="badge warning">{highPriorityCount}</span>}
          </button>
          <button
            className={`sidebar-item ${viewMode === 'no-date' ? 'active' : ''}`}
            onClick={() => setViewMode('no-date')}
          >
            <span className="nav-icon">📭</span>
            No Date
            {noDateCount > 0 && <span className="badge">{noDateCount}</span>}
          </button>
        </div>

        <div className="nav-section">
          <div className="nav-section-header">
            <h2 className="nav-section-title">Projects</h2>
            <button
              className="add-project-btn"
              onClick={() => openAddProject()}
            >
              +
            </button>
          </div>
          <div className="projects-list">
            {rootProjects.map((project) => renderProject(project))}
          </div>
        </div>
      </nav>

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}

      {showAddProject && (
        <AddProjectModal
          parentProjectId={addProjectParentId}
          onClose={() => setShowAddProject(false)}
        />
      )}
    </aside>
  );
}
