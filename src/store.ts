import { create } from 'zustand';

interface EditorStore {
  content: string;
  setContent: (content: string) => void;
  currentDirectory: string | null;
  setCurrentDirectory: (path: string | null) => void;
  files: string[];
  setFiles: (files: string[]) => void;
  currentFile: string | null;
  setCurrentFile: (file: string | null) => void;
  editorWidth: number;
  setEditorWidth: (width: number) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  insertText: (before: string, after?: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
}

export const useStore = create<EditorStore>((set) => ({
  content: '',
  setContent: (content) => set({ content }),
  currentDirectory: null,
  setCurrentDirectory: (path) => set({ currentDirectory: path }),
  files: [],
  setFiles: (files) => set({ files }),
  currentFile: null,
  setCurrentFile: (file) => set({ currentFile: file }),
  editorWidth: 50,
  setEditorWidth: (width) => set({ editorWidth: width }),
  isSidebarOpen: true,
  setIsSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  insertText: (before: string, after: string = '') => {
    const textarea = document.querySelector('textarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    const newText = before + selectedText + after;
    const newContent = textarea.value.substring(0, start) + newText + textarea.value.substring(end);
    
    set({ content: newContent });
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        end + before.length
      );
    }, 0);
  },
  isDarkMode: true,
  setIsDarkMode: async (isDark) => {
    set({ isDarkMode: isDark });
    await window.electron.ipcRenderer.invoke('save-preferences', { isDarkMode: isDark });
  },
}));

export const loadPreferences = async () => {
  const preferences = await window.electron.ipcRenderer.invoke('get-preferences');
  useStore.setState({ isDarkMode: preferences.isDarkMode });
};