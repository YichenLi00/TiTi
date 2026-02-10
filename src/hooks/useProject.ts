import { useContext } from 'react';
import { ProjectStateContext, ProjectActionsContext } from '../context/ProjectContext';

export function useProjectState() {
  const context = useContext(ProjectStateContext);
  if (context === undefined) {
    throw new Error('useProjectState must be used within ProjectProvider');
  }
  return context;
}

export function useProjectActions() {
  const context = useContext(ProjectActionsContext);
  if (context === undefined) {
    throw new Error('useProjectActions must be used within ProjectProvider');
  }
  return context;
}

// 兼容旧 API - 合并状态和操作
export function useProject() {
  const state = useProjectState();
  const actions = useProjectActions();
  return { ...state, ...actions };
}
