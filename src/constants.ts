export const PROJECT_COLORS = [
  '#007AFF',
  '#34C759',
  '#FF9500',
  '#FF3B30',
  '#AF52DE',
  '#5856D6',
  '#FF2D55',
  '#00C7BE',
];

export const PRIORITY_COLORS = {
  low: '#34C759',
  medium: '#FF9500',
  high: '#FF3B30',
} as const;

// 应用配置
export const APP_NAME = 'TiTi';
export const APP_ICON = '/vite.svg';

// 提醒相关配置（单位：毫秒）
export const REMINDER_CHECK_INTERVAL = 60 * 1000; // 1分钟检查一次
export const REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000; // 提醒窗口：24小时内

// 任务相关限制
export const MAX_SUBTASK_DEPTH = 10; // 最大子任务嵌套深度，防止无限递归
export const MAX_PROJECT_DEPTH = 5; // 最大项目嵌套深度，防止无限递归
