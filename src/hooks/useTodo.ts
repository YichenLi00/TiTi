import { useTodoState, useTodoActions } from '../context/TodoContext';

// 兼容旧 API - 合并状态和操作
export function useTodo() {
  const state = useTodoState();
  const actions = useTodoActions();
  return { ...state, ...actions };
}
