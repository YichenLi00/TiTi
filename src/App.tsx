import { AppProvider } from './context/AppProvider';
import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';
import { ErrorBoundary } from './components/ErrorBoundary';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <div className="app">
          <Sidebar />
          <MainContent />
        </div>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
