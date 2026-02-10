import { useCallback, useMemo, type ReactNode } from 'react';
import { createContext, useContext } from 'react';
import type { ViewMode, Todo, Project } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';

// State Context - 只包含数据，不包含回调
interface ViewStateContextType {
  viewMode: ViewMode;
  selectedProjectId: string | null;
  searchQuery: string;
}

const ViewStateContext = createContext<ViewStateContextType | undefined>(undefined);

// Actions Context - 只包含回调，不包含数据
interface ViewActionsContextType {
  setViewMode: (mode: ViewMode) => void;
  setSelectedProjectId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  searchTodos: (todos: Todo[], projects: Project[], query: string) => Todo[];
}

const ViewActionsContext = createContext<ViewActionsContextType | undefined>(undefined);

// Export contexts for hooks
export { ViewStateContext, ViewActionsContext };

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

  // State value - 只有数据变化才会触发重渲染
  const stateValue = useMemo(() => ({
    viewMode,
    selectedProjectId,
    searchQuery,
  }), [viewMode, selectedProjectId, searchQuery]);

  // Actions value - 稳定引用，不会触发重渲染
  const actionsValue = useMemo(() => ({
    setViewMode,
    setSelectedProjectId,
    setSearchQuery,
    searchTodos,
  }), [setViewMode, setSelectedProjectId, setSearchQuery, searchTodos]);

  return (
    <ViewStateContext.Provider value={stateValue}>
      <ViewActionsContext.Provider value={actionsValue}>
        {children}
      </ViewActionsContext.Provider>
    </ViewStateContext.Provider>
  );
}

// Custom hooks - 放在单独文件以避免 Fast Refresh 问题
// 这些 hook 在 useView.ts 中重新导出
export function useViewState() {
  const context = useContext(ViewStateContext);
  if (context === undefined) {
    throw new Error('useViewState must be used within ViewProvider');
  }
  return context;
}

export function useViewActions() {
  const context = useContext(ViewActionsContext);
  if (context === undefined) {
    throw new Error('useViewActions must be used within ViewProvider');
  }
  return context;
}
