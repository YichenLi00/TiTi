import type { ReactNode } from 'react';
import { TodoProvider } from './TodoContext';
import { ProjectProvider } from './ProjectContext';
import { ViewProvider } from './ViewContext';
import { useTodo } from '../hooks/useTodo';

interface AppProviderProps {
  children: ReactNode;
}

// 内部组件，用于访问 TodoContext 并提供给 ProjectProvider
function ProjectProviderWithTodo({ children }: { children: ReactNode }) {
  const { deleteProjectTodos } = useTodo();

  return (
    <ProjectProvider onDeleteProject={deleteProjectTodos}>
      {children}
    </ProjectProvider>
  );
}

export function AppProvider({ children }: AppProviderProps) {
  return (
    <TodoProvider>
      <ProjectProviderWithTodo>
        <ViewProvider>
          {children}
        </ViewProvider>
      </ProjectProviderWithTodo>
    </TodoProvider>
  );
}
