import { useState, useEffect, useCallback, useRef } from 'react';

// 防抖延迟时间 (ms)
const DEBOUNCE_DELAY = 300;

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window === 'undefined') {
        return initialValue;
      }
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // 使用 ref 存储防抖定时器
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 使用 ref 存储最新的值，用于防抖期间获取最新状态
  const latestValueRef = useRef<T>(storedValue);

  // 更新 ref 当 state 变化时
  useEffect(() => {
    latestValueRef.current = storedValue;
  }, [storedValue]);

  // 执行实际的 localStorage 写入
  const persistToStorage = useCallback((value: T) => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [key]);

  // 使用防抖的 setter
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      // 立即更新 React state（同步）
      setStoredValue((prev) => {
        const valueToStore = value instanceof Function ? value(prev) : value;
        latestValueRef.current = valueToStore;

        // 清除之前的定时器
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        // 设置新的防抖定时器
        debounceTimerRef.current = setTimeout(() => {
          persistToStorage(valueToStore);
        }, DEBOUNCE_DELAY);

        return valueToStore;
      });
    } catch (error) {
      console.error('Error updating state:', error);
    }
  }, [persistToStorage]);

  // 组件卸载时清除定时器并确保数据已保存
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        // 确保卸载前数据已保存
        persistToStorage(latestValueRef.current);
      }
    };
  }, [persistToStorage]);

  // 监听 storage 事件，支持多标签页同步
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue !== null) {
        try {
          const newValue = JSON.parse(event.newValue);
          latestValueRef.current = newValue;
          setStoredValue(newValue);
        } catch {
          // 忽略解析错误
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
}
