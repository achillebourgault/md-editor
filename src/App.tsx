import React, { useEffect } from 'react';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import Preview from './components/Preview';
import MarkdownToolbar from './components/MarkdownToolbar';
import { useStore } from './store';
import { ChevronLeft } from 'lucide-react';
import { loadPreferences } from './store';

const App: React.FC = () => {
  const { editorWidth, isSidebarOpen, setIsSidebarOpen } = useStore();

  useEffect(() => {
    // Charger les préférences au démarrage de l'application
    loadPreferences();
  }, []);

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <TitleBar />
      <div className="flex-1 flex overflow-hidden relative">
        <div 
          className="fixed top-1/2 -translate-y-1/2 z-50 transition-all duration-300"
          style={{ 
            left: isSidebarOpen ? '200px' : '64px',
          }}
        >
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-full p-1.5 hover:bg-[var(--bg-secondary)] transition-colors shadow-lg"
          >
            <ChevronLeft 
              size={20} 
              className={`text-[var(--text-primary)] transform transition-transform duration-200 ${isSidebarOpen ? '' : 'rotate-180'}`}
            />
          </button>
        </div>
        <div className={`
          fixed left-0 top-8 bottom-0 bg-[var(--bg-primary)] border-r border-[var(--border-color)] transition-all duration-300
          ${isSidebarOpen ? 'w-52' : 'w-[76px]'}
        `}>
          <Sidebar />
        </div>
        <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'ml-52' : 'ml-[76px]'}`}>
          <MarkdownToolbar />
          <div className="flex flex-1 h-[calc(100vh-104px)] editor-container">
            <Editor />
            <div className="w-[1px] bg-[var(--border-color)]" />
            <div 
              className="h-full"
              style={{ width: `${100 - editorWidth}%` }}
            >
              <Preview />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;