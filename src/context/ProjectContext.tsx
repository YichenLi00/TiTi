import { useCallback, useMemo, useRef, type ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { createContext } from 'react';
import type { Project } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';

const DEFAULT_PROJECT: Project = {
  id: 'inbox',
  name: 'Inbox',
  color: '#007AFF',
  createdAt: new Date().toISOString(),
  order: 0,
};

interface ProjectContextType {
  projects: Project[];
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'order'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  getSubprojects: (parentId: string) => Project[];
  replaceProjects: (projects: Project[]) => void;
  /** 注册项目删除回调，用于跨上下文通信 */
  onProjectDelete: (callback: (projectId: string) => void) => () => void;
}

export const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

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
    // 触发所有注册的删除回调
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

  const value = useMemo(() => ({
    projects,
    addProject,
    updateProject,
    deleteProject,
    getSubprojects,
    replaceProjects,
    onProjectDelete,
  }), [projects, addProject, updateProject, deleteProject, getSubprojects, replaceProjects, onProjectDelete]);

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}
