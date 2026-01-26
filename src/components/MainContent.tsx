import { useMemo, useState } from 'react';
import { isToday, isTomorrow, isThisWeek, isThisMonth, parseISO, startOfDay, compareAsc } from 'date-fns';
import { useApp } from '../hooks/useApp';
import { TodoItem } from './TodoItem';
import { AddTodoForm } from './AddTodoForm';
import { Calendar } from './Calendar';
import type { TimelineFilter, ViewMode } from '../types';
import { isTopLevel } from '../utils/filters';
import './MainContent.css';

const VIEW_MODE_CONFIG: Record<ViewMode, {
  title: string;
  emptyIcon: string;
  emptyTitle: string;
  emptySubtitle: string;
}> = {
  today: { title: 'Today', emptyIcon: '☀️', emptyTitle: 'Nothing for today', emptySubtitle: 'Enjoy your day!' },
  upcoming: { title: 'Upcoming', emptyIcon: '✨', emptyTitle: 'No tasks yet', emptySubtitle: 'Add a task to get started' },
  all: { title: 'All Tasks', emptyIcon: '✨', emptyTitle: 'No tasks yet', emptySubtitle: 'Add a task to get started' },
  calendar: { title: 'Calendar', emptyIcon: '✨', emptyTitle: 'No tasks yet', emptySubtitle: 'Add a task to get started' },
  project: { title: 'Project', emptyIcon: '✨', emptyTitle: 'No tasks yet', emptySubtitle: 'Add a task to get started' },
  search: { title: 'Search', emptyIcon: '🔍', emptyTitle: 'No results found', emptySubtitle: 'Try a different search term' },
  overdue: { title: 'Overdue', emptyIcon: '🎉', emptyTitle: 'All caught up!', emptySubtitle: 'No overdue tasks' },
  'no-date': { title: 'No Date', emptyIcon: '📅', emptyTitle: 'All tasks scheduled', emptySubtitle: 'No tasks without dates' },
  'high-priority': { title: 'High Priority', emptyIcon: '✨', emptyTitle: 'No urgent tasks', emptySubtitle: 'No high priority items' },
};

export function MainContent() {
  const {
    todos,
    projects,
    viewMode,
    selectedProjectId,
    searchQuery,
    searchTodos,
    getOverdueTodos,
    getNoDateTodos,
    getHighPriorityTodos,
  } = useApp();
  const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>('all');
  const [showCompleted, setShowCompleted] = useState(false);

  const currentProject = useMemo(() => {
    if (viewMode === 'project' && selectedProjectId) {
      return projects.find((p) => p.id === selectedProjectId);
    }
    return null;
  }, [viewMode, selectedProjectId, projects]);

  const filteredTodos = useMemo(() => {
    let result: typeof todos = [];

    // Handle smart lists and search
    switch (viewMode) {
      case 'search':
        result = searchTodos(searchQuery);
        break;
      case 'overdue':
        result = getOverdueTodos();
        break;
      case 'no-date':
        result = getNoDateTodos();
        break;
      case 'high-priority':
        result = getHighPriorityTodos();
        break;
      case 'today':
        result = todos.filter((todo) => {
          if (!todo.dueDate || !isTopLevel(todo)) return false;
          return isToday(parseISO(todo.dueDate));
        });
        break;
      case 'upcoming':
        result = todos.filter((todo) => {
          if (!todo.dueDate || !isTopLevel(todo)) return false;
          const date = parseISO(todo.dueDate);
          return date >= startOfDay(new Date());
        });
        break;
      case 'project':
        if (selectedProjectId) {
          result = todos.filter((todo) => todo.projectId === selectedProjectId && isTopLevel(todo));
        }
        break;
      case 'all':
        result = todos.filter(isTopLevel);
        break;
      default:
        result = todos.filter(isTopLevel);
    }

    // Apply timeline filter for project view
    if (viewMode === 'project' && timelineFilter !== 'all') {
      result = result.filter((todo) => {
        if (!todo.dueDate) return false;
        const date = parseISO(todo.dueDate);
        switch (timelineFilter) {
          case 'today':
            return isToday(date);
          case 'week':
            return isThisWeek(date, { weekStartsOn: 1 });
          case 'month':
            return isThisMonth(date);
          default:
            return true;
        }
      });
    }

    // Filter completed (except for smart lists that already filter)
    if (!showCompleted && !['overdue', 'no-date', 'high-priority'].includes(viewMode)) {
      result = result.filter((todo) => !todo.completed);
    }

    // Sort by due date and priority
    result.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }

      // For overdue view, sort by most overdue first
      if (viewMode === 'overdue' && a.dueDate && b.dueDate) {
        return compareAsc(parseISO(a.dueDate), parseISO(b.dueDate));
      }

      if (a.dueDate && b.dueDate) {
        const dateCompare = compareAsc(parseISO(a.dueDate), parseISO(b.dueDate));
        if (dateCompare !== 0) return dateCompare;
      }
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;

      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    return result;
  }, [todos, viewMode, selectedProjectId, timelineFilter, showCompleted, searchQuery, searchTodos, getOverdueTodos, getNoDateTodos, getHighPriorityTodos]);

  const groupedByDate = useMemo(() => {
    if (viewMode !== 'upcoming') return null;

    const groups: { [key: string]: typeof todos } = {
      today: [],
      tomorrow: [],
      thisWeek: [],
      later: [],
    };

    filteredTodos.forEach((todo) => {
      if (!todo.dueDate) {
        groups.later.push(todo);
        return;
      }
      const date = parseISO(todo.dueDate);
      if (isToday(date)) {
        groups.today.push(todo);
      } else if (isTomorrow(date)) {
        groups.tomorrow.push(todo);
      } else if (isThisWeek(date, { weekStartsOn: 1 })) {
        groups.thisWeek.push(todo);
      } else {
        groups.later.push(todo);
      }
    });

    return groups;
  }, [filteredTodos, viewMode]);

  const config = VIEW_MODE_CONFIG[viewMode];

  const title = viewMode === 'project'
    ? currentProject?.name || 'Project'
    : viewMode === 'search'
      ? `Search: "${searchQuery}"`
      : config.title;

  const emptyMessage = {
    icon: config.emptyIcon,
    title: config.emptyTitle,
    subtitle: config.emptySubtitle,
  };

  // Render calendar view
  if (viewMode === 'calendar') {
    return (
      <main className="main-content">
        <header className="content-header">
          <div className="header-title">
            <h1>Calendar</h1>
          </div>
        </header>
        <div className="content-body calendar-body">
          <Calendar />
        </div>
      </main>
    );
  }

  const completedCount = todos.filter((t) => t.completed).length;

  return (
    <main className="main-content">
      <header className="content-header">
        <div className="header-title">
          <h1>{title}</h1>
          {currentProject && (
            <span
              className="project-badge"
              style={{ backgroundColor: currentProject.color }}
            />
          )}
          {viewMode === 'overdue' && filteredTodos.length > 0 && (
            <span className="count-badge danger">{filteredTodos.length}</span>
          )}
          {viewMode === 'high-priority' && filteredTodos.length > 0 && (
            <span className="count-badge warning">{filteredTodos.length}</span>
          )}
        </div>

        <div className="header-actions">
          {viewMode === 'project' && (
            <div className="timeline-filter">
              {(['all', 'today', 'week', 'month'] as TimelineFilter[]).map((filter) => (
                <button
                  key={filter}
                  className={`filter-btn ${timelineFilter === filter ? 'active' : ''}`}
                  onClick={() => setTimelineFilter(filter)}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          )}

          {!['search', 'overdue', 'no-date', 'high-priority'].includes(viewMode) && (
            <button
              className={`show-completed-btn ${showCompleted ? 'active' : ''}`}
              onClick={() => setShowCompleted(!showCompleted)}
            >
              {showCompleted ? 'Hide' : 'Show'} Completed ({completedCount})
            </button>
          )}
        </div>
      </header>

      <div className="content-body">
        {!['search', 'overdue', 'no-date', 'high-priority'].includes(viewMode) && (
          <AddTodoForm defaultProjectId={selectedProjectId || 'inbox'} viewMode={viewMode} />
        )}

        {viewMode === 'upcoming' && groupedByDate ? (
          <div className="timeline-groups">
            {groupedByDate.today.length > 0 && (
              <div className="timeline-group">
                <h2 className="group-title">Today</h2>
                {groupedByDate.today.map((todo) => (
                  <TodoItem key={todo.id} todo={todo} />
                ))}
              </div>
            )}
            {groupedByDate.tomorrow.length > 0 && (
              <div className="timeline-group">
                <h2 className="group-title">Tomorrow</h2>
                {groupedByDate.tomorrow.map((todo) => (
                  <TodoItem key={todo.id} todo={todo} />
                ))}
              </div>
            )}
            {groupedByDate.thisWeek.length > 0 && (
              <div className="timeline-group">
                <h2 className="group-title">This Week</h2>
                {groupedByDate.thisWeek.map((todo) => (
                  <TodoItem key={todo.id} todo={todo} />
                ))}
              </div>
            )}
            {groupedByDate.later.length > 0 && (
              <div className="timeline-group">
                <h2 className="group-title">Later</h2>
                {groupedByDate.later.map((todo) => (
                  <TodoItem key={todo.id} todo={todo} />
                ))}
              </div>
            )}
            {Object.values(groupedByDate).every(arr => arr.length === 0) && (
              <div className="empty-state">
                <div className="empty-icon">{emptyMessage.icon}</div>
                <h3>{emptyMessage.title}</h3>
                <p>{emptyMessage.subtitle}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="todo-list">
            {filteredTodos.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">{emptyMessage.icon}</div>
                <h3>{emptyMessage.title}</h3>
                <p>{emptyMessage.subtitle}</p>
              </div>
            ) : (
              filteredTodos.map((todo) => (
                <TodoItem key={todo.id} todo={todo} />
              ))
            )}
          </div>
        )}
      </div>
    </main>
  );
}
