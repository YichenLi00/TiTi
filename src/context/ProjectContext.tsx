import { useCallback, useMemo, type ReactNode } from 'react';
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
}

export const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

interface ProjectProviderProps {
  children: ReactNode;
  onDeleteProject?: (projectId: string) => void;
}

export function ProjectProvider({ children, onDeleteProject }: ProjectProviderProps) {
  const [projects, setProjects] = useLocalStorage<Project[]>('titi-projects', [DEFAULT_PROJECT]);

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
    // 通知父组件删除相关任务
    onDeleteProject?.(id);
  }, [setProjects, onDeleteProject]);

  const replaceProjects = useCallback((newProjects: Project[]) => {
    setProjects(newProjects);
  }, [setProjects]);

  const getSubprojects = useCallback((parentId: string): Project[] => {
    return projects.filter((project) => project.parentId === parentId);
  }, [projects]);

  const value = useMemo(() => ({
    projects,
    addProject,
    updateProject,
    deleteProject,
    getSubprojects,
    replaceProjects,
  }), [projects, addProject, updateProject, deleteProject, getSubprojects, replaceProjects]);

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}
