export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: string;
  createdAt: string;
  projectId: string;
  priority: 'low' | 'medium' | 'high';
  parentId?: string;
  recurrence: RecurrenceType;
  reminder?: string; // ISO datetime for reminder
  completedAt?: string; // Track when completed for recurring tasks
}

export interface Project {
  id: string;
  name: string;
  color: string;
  parentId?: string;
  createdAt: string;
  order: number;
}

export type ViewMode =
  | 'today'
  | 'upcoming'
  | 'project'
  | 'all'
  | 'calendar'
  | 'overdue'
  | 'no-date'
  | 'high-priority'
  | 'search';

export type TimelineFilter = 'today' | 'week' | 'month' | 'all';
