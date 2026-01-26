import type { Todo } from '../types';

export const isTopLevel = (todo: Todo): boolean => !todo.parentId;

export const isIncomplete = (todo: Todo): boolean => !todo.completed;

export const isTopLevelIncomplete = (todo: Todo): boolean =>
  isTopLevel(todo) && isIncomplete(todo);
