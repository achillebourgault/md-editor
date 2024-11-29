const { contextBridge, ipcRenderer } = require('electron')
const path = require('path')

const validChannels = [
  'select-directory',
  'get-app-path',
  'join-path',
  'mkdir',
  'basename',
  'read-file',
  'write-file',
  'unlink',
  'open-folder-dialog',
  'get-md-files',
  'create-new-file',
  'delete-file',
  'minimize-window',
  'maximize-window',
  'close-window',
  'rename-file',
  'save-file',
  'resolve-image-path',
  'get-dirname',
  'resolve-path',
  'update-window-title',
  'open-external-link',
  'get-preferences',
  'save-preferences'
]

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel, ...args) => ipcRenderer.send(channel, ...args),
    invoke: (channel, ...args) => {
      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, ...args)
      }
      return Promise.reject(new Error(`Channel "${channel}" is not allowed`))
    },
    on: (channel, func) => {
      if (validChannels.includes(channel)) {
        ipcRenderer.on(channel, func)
      }
    },
    once: (channel, func) => {
      if (validChannels.includes(channel)) {
        ipcRenderer.once(channel, func)
      }
    },
    removeListener: (channel, func) => {
      if (validChannels.includes(channel)) {
        ipcRenderer.removeListener(channel, func)
      }
    }
  },
  path: {
    basename: (filepath) => path.basename(filepath),
    resolve: (...args) => path.resolve(...args)
  }
}) 