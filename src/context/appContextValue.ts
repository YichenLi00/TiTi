import { createContext } from 'react';
import type { Todo, Project, ViewMode } from '../types';

interface AppState {
  todos: Todo[];
  projects: Project[];
  selectedProjectId: string | null;
  viewMode: ViewMode;
  searchQuery: string;
}

export interface AppContextType extends AppState {
  addTodo: (todo: Omit<Todo, 'id' | 'createdAt'>) => void;
  updateTodo: (id: string, updates: Partial<Todo>) => void;
  deleteTodo: (id: string) => void;
  toggleTodo: (id: string) => void;
  extendTodo: (id: string, days: number) => void;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'order'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setSelectedProjectId: (id: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setSearchQuery: (query: string) => void;
  getSubprojects: (parentId: string) => Project[];
  getProjectTodos: (projectId: string) => Todo[];
  getSubtasks: (parentId: string) => Todo[];
  exportData: () => string;
  importData: (jsonData: string) => boolean;
  getOverdueTodos: () => Todo[];
  getNoDateTodos: () => Todo[];
  getHighPriorityTodos: () => Todo[];
  searchTodos: (query: string) => Todo[];
}

export const AppContext = createContext<AppContextType | undefined>(undefined);
