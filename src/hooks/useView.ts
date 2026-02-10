import { useViewState, useViewActions } from '../context/ViewContext';

export { useViewState, useViewActions };

// 兼容旧 API - 合并状态和操作
export function useView() {
  const state = useViewState();
  const actions = useViewActions();
  return { ...state, ...actions };
}
