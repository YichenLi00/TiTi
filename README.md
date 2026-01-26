# TiTi

A clean, Apple-style todo list application built with React + TypeScript + Vite. All data is stored locally in your browser via LocalStorage.

## Features

- **Projects & Subprojects** -- Organize tasks into projects with color coding; nest subprojects for deeper hierarchy
- **Tasks & Subtasks** -- Create tasks with titles, descriptions, due dates, and priority levels; break tasks into subtasks
- **Timeline Views** -- Today, Upcoming (grouped by Today/Tomorrow/This Week/Later), and All Tasks
- **Calendar View** -- Monthly calendar with task indicators; click a date to see and add tasks
- **Smart Lists** -- Overdue, High Priority, and No Date views with live badge counts
- **Search** -- Full-text search across task titles, descriptions, and project names
- **Recurring Tasks** -- Set tasks to repeat daily, weekly, or monthly; completing creates the next occurrence
- **Extend Deadline** -- Postpone tasks by 1-7 days; extending a subtask updates the parent if needed
- **Reminders** -- Browser notification support for task reminders
- **Export / Import** -- Back up and restore all data as JSON via the settings modal

## Tech Stack

- **React 19** with TypeScript
- **Vite** for dev server and builds
- **date-fns** for date manipulation
- **uuid** for ID generation
- **LocalStorage** for persistence (no backend required)

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
  components/
    Sidebar.tsx          # Navigation, search, smart lists, projects
    MainContent.tsx      # Main view area with filtering and sorting
    TodoItem.tsx         # Task display with subtasks, extend menu
    AddTodoForm.tsx      # Task creation form
    Calendar.tsx         # Monthly calendar view
  context/
    AppContext.tsx        # Central state management (CRUD, smart lists, export/import)
  hooks/
    useLocalStorage.ts   # LocalStorage persistence hook
  types/
    index.ts             # TypeScript type definitions
```
