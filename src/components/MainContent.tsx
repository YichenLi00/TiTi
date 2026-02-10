import { useMemo, useState, useCallback, memo } from 'react';
import { isToday, isTomorrow, isThisWeek, isThisMonth, parseISO, startOfDay, compareAsc } from 'date-fns';
import { useTodoState } from '../hooks/useTodo';
import { useProjectState } from '../hooks/useProject';
import { useViewState, useViewActions } from '../hooks/useView';
import { TodoItem } from './TodoItem';
import { AddTodoForm } from './AddTodoForm';
import { Calendar } from './Calendar';
import { VirtualTodoList } from './VirtualTodoList';
import type { TimelineFilter, ViewMode } from '../types';
import { isTopLevel } from '../utils/filters';
import './MainContent.css';

// 启用虚拟化的阈值
const VIRTUALIZATION_THRESHOLD = 50;

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

// 优先级排序映射 - 提取为常量
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

// 已经过滤完成的视图列表 - 提取为常量
const PRE_FILTERED_VIEWS = new Set(['overdue', 'no-date', 'high-priority']);

// 时间线过滤器函数类型
interface TodoItem {
  dueDate?: string;
}

// 时间线过滤器函数 - 预定义避免重复创建
const timelineFilters: Record<TimelineFilter, (todo: TodoItem) => boolean> = {
  today: (todo) => todo.dueDate ? isToday(parseISO(todo.dueDate)) : false,
  week: (todo) => todo.dueDate ? isThisWeek(parseISO(todo.dueDate), { weekStartsOn: 1 }) : false,
  month: (todo) => todo.dueDate ? isThisMonth(parseISO(todo.dueDate)) : false,
  all: () => true,
};

const MainContent = memo(function MainContent() {
  const { todos, overdueTodos, noDateTodos, highPriorityTodos } = useTodoState();
  const { projects } = useProjectState();
  const { viewMode, selectedProjectId, searchQuery } = useViewState();
  const { searchTodos } = useViewActions();
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
        result = searchTodos(todos, projects, searchQuery);
        break;
      case 'overdue':
        result = overdueTodos;
        break;
      case 'no-date':
        result = noDateTodos;
        break;
      case 'high-priority':
        result = highPriorityTodos;
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
      const filterFn = timelineFilters[timelineFilter];
      result = result.filter(filterFn);
    }

    // Filter completed (except for smart lists that already filter)
    if (!showCompleted && !PRE_FILTERED_VIEWS.has(viewMode)) {
      result = result.filter((todo) => !todo.completed);
    }

    // Sort by due date and priority - 使用更高效的排序
    result.sort((a, b) => {
      // 先按完成状态排序
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }

      // For overdue view, sort by most overdue first
      if (viewMode === 'overdue' && a.dueDate && b.dueDate) {
        return compareAsc(parseISO(a.dueDate), parseISO(b.dueDate));
      }

      // 按截止日期排序
      if (a.dueDate && b.dueDate) {
        const dateCompare = compareAsc(parseISO(a.dueDate), parseISO(b.dueDate));
        if (dateCompare !== 0) return dateCompare;
      }
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;

      // 最后按优先级排序
      return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    });

    return result;
  }, [todos, viewMode, selectedProjectId, timelineFilter, showCompleted, searchQuery, searchTodos, overdueTodos, noDateTodos, highPriorityTodos, projects]);

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

  // 使用 useCallback 稳定事件处理函数
  const handleTimelineFilterChange = useCallback((filter: TimelineFilter) => {
    setTimelineFilter(filter);
  }, []);

  const handleToggleShowCompleted = useCallback(() => {
    setShowCompleted(prev => !prev);
  }, []);

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
                  onClick={() => handleTimelineFilterChange(filter)}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          )}

          {!PRE_FILTERED_VIEWS.has(viewMode) && viewMode !== 'search' && (
            <button
              className={`show-completed-btn ${showCompleted ? 'active' : ''}`}
              onClick={handleToggleShowCompleted}
            >
              {showCompleted ? 'Hide' : 'Show'} Completed ({completedCount})
            </button>
          )}
        </div>
      </header>

      <div className="content-body">
        {!PRE_FILTERED_VIEWS.has(viewMode) && viewMode !== 'search' && (
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
            ) : filteredTodos.length > VIRTUALIZATION_THRESHOLD ? (
              <VirtualTodoList todos={filteredTodos} />
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
});

export { MainContent };
