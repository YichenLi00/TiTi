import { useState, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from 'date-fns';
import { useTodo } from '../hooks/useTodo';
import { TodoItem } from './TodoItem';
import './Calendar.css';

export function Calendar() {
  const { todos, addTodo } = useTodo();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const calendarDays = useMemo(() => {
    const days: Date[] = [];
    let day = calendarStart;
    while (day <= calendarEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [calendarStart, calendarEnd]);

  const getTodosForDate = (date: Date) => {
    return todos.filter((todo) => {
      if (!todo.dueDate || todo.parentId) return false;
      return isSameDay(parseISO(todo.dueDate), date);
    });
  };

  const selectedDateTodos = useMemo(() => {
    if (!selectedDate) return [];
    return todos.filter((todo) => {
      if (!todo.dueDate || todo.parentId) return false;
      return isSameDay(parseISO(todo.dueDate), selectedDate);
    });
  }, [todos, selectedDate]);

  const handleAddTask = () => {
    if (newTaskTitle.trim() && selectedDate) {
      addTodo({
        title: newTaskTitle.trim(),
        completed: false,
        projectId: 'inbox',
        priority: 'medium',
        dueDate: format(selectedDate, 'yyyy-MM-dd'),
        recurrence: 'none',
      });
      setNewTaskTitle('');
      setIsAddingTask(false);
    }
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="calendar-view">
      <div className="calendar-container">
        <div className="calendar-header">
          <h2>{format(currentMonth, 'MMMM yyyy')}</h2>
          <div className="calendar-nav">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <svg viewBox="0 0 20 20" fill="none">
                <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button onClick={() => setCurrentMonth(new Date())} className="today-btn">
              Today
            </button>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <svg viewBox="0 0 20 20" fill="none">
                <path d="M8 4l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="calendar-weekdays">
          {weekDays.map((day) => (
            <div key={day} className="weekday">{day}</div>
          ))}
        </div>

        <div className="calendar-grid">
          {calendarDays.map((day) => {
            const dayTodos = getTodosForDate(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isTodayDate = isToday(day);
            const completedCount = dayTodos.filter((t) => t.completed).length;
            const pendingCount = dayTodos.length - completedCount;

            return (
              <div
                key={day.toISOString()}
                className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isSelected ? 'selected' : ''} ${isTodayDate ? 'today' : ''}`}
                onClick={() => setSelectedDate(day)}
              >
                <span className="day-number">{format(day, 'd')}</span>
                {dayTodos.length > 0 && (
                  <div className="day-indicators">
                    {pendingCount > 0 && (
                      <span className="indicator pending">{pendingCount}</span>
                    )}
                    {completedCount > 0 && (
                      <span className="indicator completed">{completedCount}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="calendar-sidebar">
        <div className="sidebar-header">
          <h3>
            {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : 'Select a date'}
          </h3>
          {selectedDate && (
            <button
              className="add-task-btn"
              onClick={() => setIsAddingTask(true)}
            >
              + Add Task
            </button>
          )}
        </div>

        {isAddingTask && selectedDate && (
          <div className="quick-add-form">
            <input
              type="text"
              placeholder="Task title..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTask();
                if (e.key === 'Escape') {
                  setNewTaskTitle('');
                  setIsAddingTask(false);
                }
              }}
              autoFocus
            />
            <div className="quick-add-actions">
              <button className="btn-cancel" onClick={() => setIsAddingTask(false)}>
                Cancel
              </button>
              <button className="btn-add" onClick={handleAddTask}>
                Add
              </button>
            </div>
          </div>
        )}

        <div className="sidebar-tasks">
          {selectedDateTodos.length === 0 ? (
            <div className="no-tasks">
              <p>No tasks for this date</p>
            </div>
          ) : (
            selectedDateTodos.map((todo) => (
              <TodoItem key={todo.id} todo={todo} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
