import { useCallback, useMemo, type ReactNode } from 'react';
import { createContext } from 'react';
import type { ViewMode, Todo, Project } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface ViewContextType {
  // 视图状态
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  // 搜索
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchTodos: (todos: Todo[], projects: Project[], query: string) => Todo[];
}

export const ViewContext = createContext<ViewContextType | undefined>(undefined);

export function ViewProvider({ children }: { children: ReactNode }) {
  const [selectedProjectId, setSelectedProjectId] = useLocalStorage<string | null>('titi-selected-project', null);
  const [viewMode, setViewMode] = useLocalStorage<ViewMode>('titi-view-mode', 'today');
  const [searchQuery, setSearchQuery] = useLocalStorage<string>('titi-search', '');

  const searchTodos = useCallback((todos: Todo[], projects: Project[], query: string): Todo[] => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    return todos.filter((todo) => {
      const titleMatch = todo.title.toLowerCase().includes(lowerQuery);
      const descMatch = todo.description?.toLowerCase().includes(lowerQuery);
      const project = projects.find((p) => p.id === todo.projectId);
      const projectMatch = project?.name.toLowerCase().includes(lowerQuery);
      return titleMatch || descMatch || projectMatch;
    });
  }, []);

  const value = useMemo(() => ({
    viewMode,
    setViewMode,
    selectedProjectId,
    setSelectedProjectId,
    searchQuery,
    setSearchQuery,
    searchTodos,
  }), [viewMode, setViewMode, selectedProjectId, setSelectedProjectId, searchQuery, setSearchQuery, searchTodos]);

  return (
    <ViewContext.Provider value={value}>
      {children}
    </ViewContext.Provider>
  );
}
