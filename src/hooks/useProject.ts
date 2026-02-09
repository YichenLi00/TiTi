import { useProjectState as useProjectStateFromContext, useProjectActions as useProjectActionsFromContext } from '../context/ProjectContext';

// 兼容旧 API - 合并状态和操作
export function useProject() {
  const state = useProjectStateFromContext();
  const actions = useProjectActionsFromContext();
  return { ...state, ...actions };
}

// 如果只读数据，使用这个 hook 避免不必要的重渲染
export { useProjectStateFromContext as useProjectState };

// 如果只使用操作，使用这个 hook 获得稳定引用
export { useProjectActionsFromContext as useProjectActions };
