import { useEffect, useCallback, useRef, type ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { addDays, addWeeks, addMonths, parseISO, format, isAfter, isBefore } from 'date-fns';
import type { Todo, Project, ViewMode } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { isTopLevelIncomplete } from '../utils/filters';
import { AppContext } from './appContextValue';

const DEFAULT_PROJECT: Project = {
  id: 'inbox',
  name: 'Inbox',
  color: '#007AFF',
  createdAt: new Date().toISOString(),
  order: 0,
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [todos, setTodos] = useLocalStorage<Todo[]>('titi-todos', []);
  const [projects, setProjects] = useLocalStorage<Project[]>('titi-projects', [DEFAULT_PROJECT]);
  const [selectedProjectId, setSelectedProjectId] = useLocalStorage<string | null>('titi-selected-project', null);
  const [viewMode, setViewMode] = useLocalStorage<ViewMode>('titi-view-mode', 'today');
  const [searchQuery, setSearchQuery] = useLocalStorage<string>('titi-search', '');

  // Request notification permission once
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Check for reminders on an interval, using a ref to avoid recreating
  const todosRef = useRef(todos);
  useEffect(() => {
    todosRef.current = todos;
  }, [todos]);

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      todosRef.current.forEach((todo) => {
        if (todo.reminder && !todo.completed) {
          const reminderTime = parseISO(todo.reminder);
          if (isBefore(reminderTime, now) && isAfter(reminderTime, addDays(now, -1))) {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('TiTi Reminder', {
                body: todo.title,
                icon: '/vite.svg',
              });
              setTodos((prev) =>
                prev.map((t) => (t.id === todo.id ? { ...t, reminder: undefined } : t))
              );
            }
          }
        }
      });
    };

    checkReminders();
    const interval = setInterval(checkReminders, 60000);
    return () => clearInterval(interval);
  }, [setTodos]);

  const addTodo = (todo: Omit<Todo, 'id' | 'createdAt'>) => {
    const newTodo: Todo = {
      ...todo,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      recurrence: todo.recurrence || 'none',
    };
    setTodos((prev) => [...prev, newTodo]);
  };

  const updateTodo = (id: string, updates: Partial<Todo>) => {
    setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? { ...todo, ...updates } : todo))
    );
  };

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id && todo.parentId !== id));
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) => {
      const todo = prev.find((t) => t.id === id);
      if (!todo) return prev;

      const isCompleting = !todo.completed;

      // If completing a recurring task, create next occurrence
      if (isCompleting && todo.recurrence !== 'none' && todo.dueDate) {
        const currentDate = parseISO(todo.dueDate);
        let nextDate: Date;

        switch (todo.recurrence) {
          case 'daily':
            nextDate = addDays(currentDate, 1);
            break;
          case 'weekly':
            nextDate = addWeeks(currentDate, 1);
            break;
          case 'monthly':
            nextDate = addMonths(currentDate, 1);
            break;
          default:
            nextDate = currentDate;
        }

        // Create new recurring task
        const newTodo: Todo = {
          ...todo,
          id: uuidv4(),
          completed: false,
          dueDate: format(nextDate, 'yyyy-MM-dd'),
          createdAt: new Date().toISOString(),
          completedAt: undefined,
        };

        return prev.map((t) =>
          t.id === id
            ? { ...t, completed: true, completedAt: new Date().toISOString() }
            : t
        ).concat(newTodo);
      }

      return prev.map((t) =>
        t.id === id
          ? {
              ...t,
              completed: !t.completed,
              completedAt: isCompleting ? new Date().toISOString() : undefined,
            }
          : t
      );
    });
  };

  const extendTodo = (id: string, days: number) => {
    setTodos((prev) => {
      const todo = prev.find((t) => t.id === id);
      if (!todo) return prev;

      const currentDate = todo.dueDate ? parseISO(todo.dueDate) : new Date();
      const newDueDate = format(addDays(currentDate, days), 'yyyy-MM-dd');

      return prev.map((t) => {
        if (t.id === id) {
          return { ...t, dueDate: newDueDate };
        }
        if (todo.parentId && t.id === todo.parentId) {
          const parentDueDate = t.dueDate ? parseISO(t.dueDate) : null;
          const newSubtaskDate = parseISO(newDueDate);
          if (!parentDueDate || isAfter(newSubtaskDate, parentDueDate)) {
            return { ...t, dueDate: newDueDate };
          }
        }
        return t;
      });
    });
  };

  const addProject = (project: Omit<Project, 'id' | 'createdAt' | 'order'>) => {
    const newProject: Project = {
      ...project,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      order: projects.length,
    };
    setProjects((prev) => [...prev, newProject]);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === id ? { ...project, ...updates } : project
      )
    );
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((project) => project.id !== id));
    setTodos((prev) => prev.filter((todo) => todo.projectId !== id));
  };

  const getSubprojects = (parentId: string): Project[] => {
    return projects.filter((project) => project.parentId === parentId);
  };

  const getProjectTodos = (projectId: string): Todo[] => {
    return todos.filter((todo) => todo.projectId === projectId);
  };

  const getSubtasks = (parentId: string): Todo[] => {
    return todos.filter((todo) => todo.parentId === parentId);
  };

  // Smart lists
  const getOverdueTodos = useCallback((): Todo[] => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return todos.filter((todo) => {
      if (!todo.dueDate || !isTopLevelIncomplete(todo)) return false;
      return isBefore(parseISO(todo.dueDate), now);
    });
  }, [todos]);

  const getNoDateTodos = useCallback((): Todo[] => {
    return todos.filter((todo) => !todo.dueDate && isTopLevelIncomplete(todo));
  }, [todos]);

  const getHighPriorityTodos = useCallback((): Todo[] => {
    return todos.filter((todo) => todo.priority === 'high' && isTopLevelIncomplete(todo));
  }, [todos]);

  // Search
  const searchTodos = useCallback((query: string): Todo[] => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    return todos.filter((todo) => {
      const titleMatch = todo.title.toLowerCase().includes(lowerQuery);
      const descMatch = todo.description?.toLowerCase().includes(lowerQuery);
      const project = projects.find((p) => p.id === todo.projectId);
      const projectMatch = project?.name.toLowerCase().includes(lowerQuery);
      return titleMatch || descMatch || projectMatch;
    });
  }, [todos, projects]);

  // Export/Import
  const exportData = useCallback((): string => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      todos,
      projects,
    };
    return JSON.stringify(data, null, 2);
  }, [todos, projects]);

  const importData = useCallback((jsonData: string): boolean => {
    try {
      const data = JSON.parse(jsonData);
      if (data.todos && Array.isArray(data.todos)) {
        setTodos(data.todos);
      }
      if (data.projects && Array.isArray(data.projects)) {
        setProjects(data.projects);
      }
      return true;
    } catch {
      return false;
    }
  }, [setTodos, setProjects]);

  return (
    <AppContext.Provider
      value={{
        todos,
        projects,
        selectedProjectId,
        viewMode,
        searchQuery,
        addTodo,
        updateTodo,
        deleteTodo,
        toggleTodo,
        extendTodo,
        addProject,
        updateProject,
        deleteProject,
        setSelectedProjectId,
        setViewMode,
        setSearchQuery,
        getSubprojects,
        getProjectTodos,
        getSubtasks,
        exportData,
        importData,
        getOverdueTodos,
        getNoDateTodos,
        getHighPriorityTodos,
        searchTodos,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

