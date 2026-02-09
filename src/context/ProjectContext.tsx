import { useCallback, useMemo, useRef, type ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { createContext, useContext } from 'react';
import type { Project } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';

const DEFAULT_PROJECT: Project = {
  id: 'inbox',
  name: 'Inbox',
  color: '#007AFF',
  createdAt: new Date().toISOString(),
  order: 0,
};

// State Context - 只包含数据
interface ProjectStateContextType {
  projects: Project[];
}

const ProjectStateContext = createContext<ProjectStateContextType | undefined>(undefined);

// Actions Context - 只包含回调和查询函数
interface ProjectActionsContextType {
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'order'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  getSubprojects: (parentId: string) => Project[];
  replaceProjects: (projects: Project[]) => void;
  /** 注册项目删除回调，用于跨上下文通信 */
  onProjectDelete: (callback: (projectId: string) => void) => () => void;
}

const ProjectActionsContext = createContext<ProjectActionsContextType | undefined>(undefined);

interface ProjectProviderProps {
  children: ReactNode;
}

export function ProjectProvider({ children }: ProjectProviderProps) {
  const [projects, setProjects] = useLocalStorage<Project[]>('titi-projects', [DEFAULT_PROJECT]);
  const deleteCallbacksRef = useRef<Set<(projectId: string) => void>>(new Set());

  const addProject = useCallback((project: Omit<Project, 'id' | 'createdAt' | 'order'>) => {
    const newProject: Project = {
      ...project,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      order: projects.length,
    };
    setProjects((prev) => [...prev, newProject]);
  }, [projects.length, setProjects]);

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === id ? { ...project, ...updates } : project
      )
    );
  }, [setProjects]);

  const deleteProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((project) => project.id !== id));
    deleteCallbacksRef.current.forEach((callback) => callback(id));
  }, [setProjects]);

  const replaceProjects = useCallback((newProjects: Project[]) => {
    setProjects(newProjects);
  }, [setProjects]);

  const getSubprojects = useCallback((parentId: string): Project[] => {
    return projects.filter((project) => project.parentId === parentId);
  }, [projects]);

  const onProjectDelete = useCallback((callback: (projectId: string) => void) => {
    deleteCallbacksRef.current.add(callback);
    return () => {
      deleteCallbacksRef.current.delete(callback);
    };
  }, []);

  // State value - 只有数据
  const stateValue = useMemo(() => ({
    projects,
  }), [projects]);

  // Actions value - 稳定引用
  const actionsValue = useMemo(() => ({
    addProject,
    updateProject,
    deleteProject,
    getSubprojects,
    replaceProjects,
    onProjectDelete,
  }), [addProject, updateProject, deleteProject, getSubprojects, replaceProjects, onProjectDelete]);

  return (
    <ProjectStateContext.Provider value={stateValue}>
      <ProjectActionsContext.Provider value={actionsValue}>
        {children}
      </ProjectActionsContext.Provider>
    </ProjectStateContext.Provider>
  );
}

// Custom hooks
export function useProjectState() {
  const context = useContext(ProjectStateContext);
  if (context === undefined) {
    throw new Error('useProjectState must be used within ProjectProvider');
  }
  return context;
}

export function useProjectActions() {
  const context = useContext(ProjectActionsContext);
  if (context === undefined) {
    throw new Error('useProjectActions must be used within ProjectProvider');
  }
  return context;
}
