import type { Todo, Project } from '../types';

export function exportData(todos: Todo[], projects: Project[]): string {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    todos,
    projects,
  };
  return JSON.stringify(data, null, 2);
}

export function importData(jsonData: string): { todos?: Todo[]; projects?: Project[] } | null {
  try {
    const data = JSON.parse(jsonData);
    if (typeof data !== 'object' || data === null) {
      return null;
    }

    const result: { todos?: Todo[]; projects?: Project[] } = {};

    if (data.todos && Array.isArray(data.todos)) {
      const validTodos = data.todos.filter((todo: unknown) => {
        if (typeof todo !== 'object' || todo === null) return false;
        const t = todo as Record<string, unknown>;
        return typeof t.id === 'string' &&
               typeof t.title === 'string' &&
               typeof t.completed === 'boolean' &&
               typeof t.projectId === 'string';
      });
      if (validTodos.length > 0) {
        result.todos = validTodos as Todo[];
      }
    }

    if (data.projects && Array.isArray(data.projects)) {
      const validProjects = data.projects.filter((project: unknown) => {
        if (typeof project !== 'object' || project === null) return false;
        const p = project as Record<string, unknown>;
        return typeof p.id === 'string' &&
               typeof p.name === 'string' &&
               typeof p.color === 'string';
      });
      if (validProjects.length > 0) {
        result.projects = validProjects as Project[];
      }
    }

    return Object.keys(result).length > 0 ? result : null;
  } catch {
    return null;
  }
}
