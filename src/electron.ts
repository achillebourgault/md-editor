export const ipcRenderer = window.electron?.ipcRenderer ?? {
  invoke: async () => {
    console.warn('ipcRenderer not available - running in web mode');
    return null;
  },
  on: () => {
    console.warn('ipcRenderer not available - running in web mode');
  },
  once: () => {
    console.warn('ipcRenderer not available - running in web mode');
  },
  removeListener: () => {
    console.warn('ipcRenderer not available - running in web mode');
  }
}; 