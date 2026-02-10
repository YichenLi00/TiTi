import { memo } from 'react';
import { List, type RowComponentProps } from 'react-window';
import type { Todo } from '../types';
import { TodoItem } from './TodoItem';
import './VirtualTodoList.css';

interface VirtualTodoListProps {
  todos: Todo[];
  itemHeight?: number;
  overscanCount?: number;
}

// 行数据通过 rowProps 传递
interface RowData {
  todos: Todo[];
}

// 列表行组件
function Row({ index, style, todos }: RowComponentProps<RowData>) {
  const todo = todos[index];
  return (
    <div style={style} className="virtual-list-row" key={todo.id}>
      <TodoItem todo={todo} />
    </div>
  );
}

// 虚拟化列表组件
const VirtualTodoList = memo(function VirtualTodoList({
  todos,
  itemHeight = 64,
  overscanCount = 5,
}: VirtualTodoListProps) {
  // 获取列表容器高度
  const getListHeight = () => {
    const containerHeight = window.innerHeight - 200; // 减去头部和边距
    const maxHeight = todos.length * itemHeight;
    return Math.min(containerHeight, maxHeight);
  };

  if (todos.length === 0) {
    return null;
  }

  const height = getListHeight();

  return (
    <div className="virtual-todo-list">
      <List<RowData>
        style={{ height }}
        rowCount={todos.length}
        rowHeight={itemHeight}
        rowProps={{ todos }}
        overscanCount={overscanCount}
        rowComponent={Row}
      />
    </div>
  );
});

export { VirtualTodoList };
