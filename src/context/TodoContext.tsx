import { useEffect, useCallback, useRef, useMemo, type ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { addDays, addWeeks, addMonths, parseISO, format, isBefore, isAfter } from 'date-fns';
import { createContext } from 'react';
import type { Todo } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { isTopLevelIncomplete } from '../utils/filters';

interface TodoContextType {
  todos: Todo[];
  addTodo: (todo: Omit<Todo, 'id' | 'createdAt'>) => void;
  updateTodo: (id: string, updates: Partial<Todo>) => void;
  deleteTodo: (id: string) => void;
  toggleTodo: (id: string) => void;
  extendTodo: (id: string, days: number) => void;
  getSubtasks: (parentId: string) => Todo[];
  getProjectTodos: (projectId: string) => Todo[];
  deleteProjectTodos: (projectId: string) => void;
  replaceTodos: (todos: Todo[]) => void;
  // Smart lists - 已用 useMemo 优化
  overdueTodos: Todo[];
  noDateTodos: Todo[];
  highPriorityTodos: Todo[];
}

export const TodoContext = createContext<TodoContextType | undefined>(undefined);

export function TodoProvider({ children }: { children: ReactNode }) {
  const [todos, setTodos] = useLocalStorage<Todo[]>('titi-todos', []);

  // 用于提醒检查的 ref
  const todosRef = useRef(todos);
  useEffect(() => {
    todosRef.current = todos;
  }, [todos]);

  // 提醒通知检查
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      todosRef.current.forEach((todo) => {
        if (todo.reminder && !todo.completed) {
          const reminderTime = parseISO(todo.reminder);
          if (isBefore(reminderTime, now) && isAfter(reminderTime, addDays(now, -1))) {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('TiTi Reminder', {
                body: todo.title,
                icon: '/vite.svg',
              });
              setTodos((prev) =>
                prev.map((t) => (t.id === todo.id ? { ...t, reminder: undefined } : t))
              );
            }
          }
        }
      });
    };

    checkReminders();
    const interval = setInterval(checkReminders, 60000);
    return () => clearInterval(interval);
  }, [setTodos]);

  const addTodo = useCallback((todo: Omit<Todo, 'id' | 'createdAt'>) => {
    const newTodo: Todo = {
      ...todo,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      recurrence: todo.recurrence || 'none',
    };
    setTodos((prev) => [...prev, newTodo]);
  }, [setTodos]);

  const updateTodo = useCallback((id: string, updates: Partial<Todo>) => {
    setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? { ...todo, ...updates } : todo))
    );
  }, [setTodos]);

  const deleteTodo = useCallback((id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id && todo.parentId !== id));
  }, [setTodos]);

  const toggleTodo = useCallback((id: string) => {
    setTodos((prev) => {
      const todo = prev.find((t) => t.id === id);
      if (!todo) return prev;

      const isCompleting = !todo.completed;

      if (isCompleting && todo.recurrence !== 'none' && todo.dueDate) {
        const currentDate = parseISO(todo.dueDate);
        let nextDate: Date;

        switch (todo.recurrence) {
          case 'daily':
            nextDate = addDays(currentDate, 1);
            break;
          case 'weekly':
            nextDate = addWeeks(currentDate, 1);
            break;
          case 'monthly':
            nextDate = addMonths(currentDate, 1);
            break;
          default:
            nextDate = currentDate;
        }

        const newTodo: Todo = {
          ...todo,
          id: uuidv4(),
          completed: false,
          dueDate: format(nextDate, 'yyyy-MM-dd'),
          createdAt: new Date().toISOString(),
          completedAt: undefined,
        };

        return prev.map((t) =>
          t.id === id
            ? { ...t, completed: true, completedAt: new Date().toISOString() }
            : t
        ).concat(newTodo);
      }

      return prev.map((t) =>
        t.id === id
          ? {
              ...t,
              completed: !t.completed,
              completedAt: isCompleting ? new Date().toISOString() : undefined,
            }
          : t
      );
    });
  }, [setTodos]);

  const extendTodo = useCallback((id: string, days: number) => {
    setTodos((prev) => {
      const todo = prev.find((t) => t.id === id);
      if (!todo) return prev;

      const currentDate = todo.dueDate ? parseISO(todo.dueDate) : new Date();
      const newDueDate = format(addDays(currentDate, days), 'yyyy-MM-dd');

      return prev.map((t) => {
        if (t.id === id) {
          return { ...t, dueDate: newDueDate };
        }
        if (todo.parentId && t.id === todo.parentId) {
          const parentDueDate = t.dueDate ? parseISO(t.dueDate) : null;
          const newSubtaskDate = parseISO(newDueDate);
          if (!parentDueDate || isAfter(newSubtaskDate, parentDueDate)) {
            return { ...t, dueDate: newDueDate };
          }
        }
        return t;
      });
    });
  }, [setTodos]);

  const getSubtasks = useCallback((parentId: string): Todo[] => {
    return todos.filter((todo) => todo.parentId === parentId);
  }, [todos]);

  const getProjectTodos = useCallback((projectId: string): Todo[] => {
    return todos.filter((todo) => todo.projectId === projectId);
  }, [todos]);

  const deleteProjectTodos = useCallback((projectId: string) => {
    setTodos((prev) => prev.filter((todo) => todo.projectId !== projectId));
  }, [setTodos]);

  const replaceTodos = useCallback((newTodos: Todo[]) => {
    setTodos(newTodos);
  }, [setTodos]);

  // 请求通知权限
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // 智能列表 - 使用 useMemo 缓存
  const overdueTodos = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return todos.filter((todo) => {
      if (!todo.dueDate || !isTopLevelIncomplete(todo)) return false;
      return isBefore(parseISO(todo.dueDate), now);
    });
  }, [todos]);

  const noDateTodos = useMemo(() => {
    return todos.filter((todo) => !todo.dueDate && isTopLevelIncomplete(todo));
  }, [todos]);

  const highPriorityTodos = useMemo(() => {
    return todos.filter((todo) => todo.priority === 'high' && isTopLevelIncomplete(todo));
  }, [todos]);

  const value = useMemo(() => ({
    todos,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodo,
    extendTodo,
    getSubtasks,
    getProjectTodos,
    deleteProjectTodos,
    replaceTodos,
    overdueTodos,
    noDateTodos,
    highPriorityTodos,
  }), [todos, addTodo, updateTodo, deleteTodo, toggleTodo, extendTodo, getSubtasks, getProjectTodos, deleteProjectTodos, replaceTodos, overdueTodos, noDateTodos, highPriorityTodos]);

  return (
    <TodoContext.Provider value={value}>
      {children}
    </TodoContext.Provider>
  );
}
