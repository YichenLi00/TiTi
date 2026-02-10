import { useContext } from 'react';
import { TodoStateContext, TodoActionsContext } from '../context/TodoContext';

export function useTodoState() {
  const context = useContext(TodoStateContext);
  if (context === undefined) {
    throw new Error('useTodoState must be used within TodoProvider');
  }
  return context;
}

export function useTodoActions() {
  const context = useContext(TodoActionsContext);
  if (context === undefined) {
    throw new Error('useTodoActions must be used within TodoProvider');
  }
  return context;
}

// 兼容旧 API - 合并状态和操作
export function useTodo() {
  const state = useTodoState();
  const actions = useTodoActions();
  return { ...state, ...actions };
}
