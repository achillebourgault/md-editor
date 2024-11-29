const { app, BrowserWindow, ipcMain, dialog, protocol, session, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const { exec } = require('child_process')
const { net } = require('electron')
let store;
(async () => {
  const Store = (await import('electron-store')).default;
  store = new Store();
})();

const APP_PROTOCOL = 'md-local';
const PROTOCOL = 'app';

protocol.registerSchemesAsPrivileged([
  { 
    scheme: 'app', 
    Yprivileges: { 
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true
    }
  },
  {
    scheme: 'app-protocol',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true
    }
  },
  { 
    scheme: APP_PROTOCOL,
    privileges: { 
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      bypassCSP: true
    }
  }
]);

let mainWindow = null

app.whenReady().then(() => {
  console.log('App is ready');
  console.log('App path:', app.getAppPath());
  console.log('__dirname:', __dirname);

  protocol.handle('file', (request) => {
    const filePath = decodeURIComponent(request.url.replace('file:///', ''));
    return net.fetch(`file:///${filePath}`);
  });

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' app: 'unsafe-inline' 'unsafe-eval' data: blob: *;",
          "script-src 'self' app: 'unsafe-inline' 'unsafe-eval';",
          "style-src 'self' app: 'unsafe-inline';",
          "img-src 'self' app: data: blob: file: http: https: *;",
          "font-src 'self' app: data:;",
          "media-src 'self' app: data: blob:;",
          "connect-src 'self' app: ws: wss: *;"
        ].join(' ')
      }
    });
  });

  protocol.registerFileProtocol(APP_PROTOCOL, (request, callback) => {
    try {
      const url = request.url.replace(`${APP_PROTOCOL}://`, '');
      const decodedPath = decodeURIComponent(url);
      
      const windowsPath = decodedPath.replace(/^\//, '').replace(/\//g, '\\');
      const absolutePath = windowsPath.match(/^[A-Za-z]:\\/) 
        ? windowsPath 
        : `${windowsPath[0]}:\\${windowsPath.slice(2)}`;

      if (!fs.existsSync(absolutePath)) {
        console.error('File not found:', absolutePath);
        return callback({ error: -6 });
      }

      console.log('Loading image from:', absolutePath);
      
      callback({ path: absolutePath });
    } catch (error) {
      console.error('Error handling protocol:', error);
      callback({ error: -2 });
    }
  });

  protocol.registerFileProtocol(PROTOCOL, (request, callback) => {
    const url = request.url.replace(`${PROTOCOL}://`, '');
    const decodedUrl = decodeURIComponent(url);
    
    let filePath;
    if (decodedUrl.startsWith('index.html/')) {
      filePath = path.join(__dirname, '../dist', decodedUrl.replace('index.html/', ''));
    } else {
      filePath = path.join(__dirname, '../dist', decodedUrl);
    }
    
    console.log('Requested URL:', url);
    console.log('Loading file from:', filePath);
    
    try {
      if (fs.existsSync(filePath)) {
        return callback(filePath);
      } else {
        console.error('File not found:', filePath);
        return callback({ error: -6 });
      }
    } catch (error) {
      console.error('Error loading file:', error);
      return callback({ error: -2 });
    }
  });

  createWindow();
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true
    }
  });

  console.log('Preload path:', path.join(__dirname, 'preload.js'));
  console.log('__dirname:', __dirname);
  console.log('Current working directory:', process.cwd());

  if (app.isPackaged) {
    const preloadPath = path.join(__dirname, 'preload.js');
    console.log('Preload file exists:', fs.existsSync(preloadPath));
    
    console.log('dist-electron contents:', fs.readdirSync(__dirname));

    mainWindow.loadURL(`${PROTOCOL}://index.html`);
  } else {
    mainWindow.loadURL('http://localhost:5173');
  }
  //mainWindow.webContents.openDevTools();

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', {
      code: errorCode,
      description: errorDescription
    });
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page loaded successfully');
  });

  mainWindow.webContents.on('console-message', (event, level, message) => {
    console.log('Renderer Console:', message);
  });

  console.log('Process type:', process.type);
  console.log('Process argv:', process.argv);
  console.log('App path:', app.getAppPath());
  console.log('__dirname:', __dirname);
  console.log('Current working directory:', process.cwd());
  
  try {
    const distPath = path.join(app.getAppPath(), 'dist');
    console.log('Dist directory contents:', fs.readdirSync(distPath));
  } catch (error) {
    console.error('Error listing dist directory:', error);
  }

  ipcMain.on('minimize-window', () => mainWindow.minimize())
  ipcMain.on('maximize-window', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  })
  ipcMain.on('close-window', () => mainWindow.close())

  ipcMain.handle('open-folder-dialog', async () => {
    try {
      console.log('Opening folder dialog...');
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
      });
      console.log('Dialog result:', result);
      return result;
    } catch (error) {
      console.error('Dialog error:', error);
      return null;
    }
  })

  ipcMain.handle('get-md-files', async (_, directoryPath) => {
    try {
      console.log('Reading directory:', directoryPath)
      const files = await fs.promises.readdir(directoryPath)
      const mdFiles = files.filter(file => file.endsWith('.md'))
      const fullPaths = mdFiles.map(file => path.join(directoryPath, file))
      console.log('Found MD files:', fullPaths)
      return fullPaths
    } catch (error) {
      console.error('Error reading directory:', error)
      return []
    }
  })

  ipcMain.handle('create-new-file', async (_, directoryPath, fileName) => {
    try {
      const filePath = path.join(directoryPath, `${fileName}.md`)
      
      const exists = await fs.promises.access(filePath)
        .then(() => true)
        .catch(() => false)
      
      if (exists) {
        console.error('File already exists:', filePath)
        return null
      }
      
      await fs.promises.writeFile(filePath, '')
      return filePath
    } catch (error) {
      console.error('Error creating file:', error)
      return null
    }
  })

  ipcMain.handle('delete-file', async (_, filePath) => {
    try {
      const exists = await fs.access(filePath).then(() => true).catch(() => false)
      if (exists) {
        await fs.unlink(filePath)
      }
      return true
    } catch (error) {
      console.error('Error deleting file:', error)
      return false
    }
  })

  ipcMain.handle('read-file', async (_, filePath) => {
    try {
      const exists = await fs.promises.access(filePath)
        .then(() => true)
        .catch(() => false)
      
      if (!exists) {
        await fs.promises.writeFile(filePath, '')
        return ''
      }
      
      const content = await fs.promises.readFile(filePath, 'utf-8')
      return content
    } catch (error) {
      console.error('Error reading file:', error)
      return ''
    }
  })

  ipcMain.handle('rename-file', async (_, oldPath, newName) => {
    try {
      const directory = path.dirname(oldPath)
      const newPath = path.join(directory, `${newName}.md`)
      await fs.promises.rename(oldPath, newPath)
      return newPath
    } catch (error) {
      console.error('Error renaming file:', error)
      return null
    }
  })

  ipcMain.handle('save-file', async (_, filePath, content) => {
    try {
      await fs.promises.writeFile(filePath, content, 'utf-8')
      return true
    } catch (error) {
      console.error('Error saving file:', error)
      return false
    }
  })

  ipcMain.on('open-in-explorer', (_, pathToOpen) => {
    if (!pathToOpen) return;
    
    switch (process.platform) {
      case 'win32':
        exec(`explorer.exe "${pathToOpen}"`);
        break;
      case 'darwin':
        exec(`open "${pathToOpen}"`);
        break;
      case 'linux':
        exec(`xdg-open "${pathToOpen}"`);
        break;
    }
  });

  ipcMain.on('update-window-title', (_, { directory, file }) => {
    let title = 'md-editor'
    
    if (directory) {
      const folderName = path.basename(directory)
      title = `${folderName} - ${title}`
      
      if (file) {
        const fileName = path.basename(file)
        title = `${folderName} - ${fileName} - ${title}`
      }
    }
    
    mainWindow.setTitle(title)
  })

  ipcMain.on('resolve-path', (event, basePath, relativePath) => {
    try {
      const absolutePath = path.resolve(basePath, relativePath);
      event.returnValue = `file://${absolutePath.replace(/\\/g, '/')}`;
    } catch (error) {
      console.error('Error resolving path:', error);
      event.returnValue = relativePath;
    }
  });

  ipcMain.handle('resolve-image-path', async (_, directoryPath, imagePath) => {
    try {
      const absolutePath = path.resolve(directoryPath, imagePath);
      const exists = await fs.access(absolutePath).then(() => true).catch(() => false);
      
      if (!exists) {
        console.error('Image not found:', absolutePath);
        return '';
      }
      
      const imageBuffer = await fs.readFile(absolutePath);
      const mimeType = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
      }[path.extname(absolutePath).toLowerCase()] || 'image/png';
      
      return `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
    } catch (error) {
      console.error('Error resolving image path:', error);
      return '';
    }
  });

  ipcMain.handle('get-dirname', (_, filePath) => {
    return path.dirname(filePath);
  });

  ipcMain.handle('resolve-path', (_, basePath, relativePath) => {
    try {
      const absolutePath = path.resolve(basePath, relativePath);
      return absolutePath;
    } catch (error) {
      console.error('Error resolving path:', error);
      return relativePath;
    }
  });

  mainWindow.webContents.on('preload-error', (event, preloadPath, error) => {
    console.error('Preload error:', { preloadPath, error });
  });

  ipcMain.on('open-external-link', (_, url) => {
    shell.openExternal(url);
  });

  ipcMain.handle('get-preferences', async () => {
    if (!store) {
      const Store = (await import('electron-store')).default;
      store = new Store();
    }
    return {
      isDarkMode: store.get('isDarkMode', true)
    };
  });

  ipcMain.handle('save-preferences', async (_, preferences) => {
    try {
      if (!store) {
        const Store = (await import('electron-store')).default;
        store = new Store();
      }
      store.set('isDarkMode', preferences.isDarkMode);
      return true;
    } catch (error) {
      console.error('Error saving preferences:', error);
      return false;
    }
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

console.log('Vérification des fichiers de build...');
const distPath = path.join(__dirname, 'dist');
const electronPath = path.join(__dirname, 'dist-electron');

if (fs.existsSync(distPath)) {
  console.log('Contenu du dossier dist:', fs.readdirSync(distPath));
}
if (fs.existsSync(electronPath)) {
  console.log('Contenu du dossier dist-electron:', fs.readdirSync(electronPath));
}

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});



