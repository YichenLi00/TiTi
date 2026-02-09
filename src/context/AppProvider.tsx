import type { ReactNode } from 'react';
import { TodoProvider } from './TodoContext';
import { ProjectProvider } from './ProjectContext';
import { ViewProvider } from './ViewContext';

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  return (
    <ProjectProvider>
      <TodoProvider>
        <ViewProvider>
          {children}
        </ViewProvider>
      </TodoProvider>
    </ProjectProvider>
  );
}
