import { useState, useEffect } from 'react'
import { Folder, FileText, Plus, Trash, ChevronLeft } from 'lucide-react'
import { useStore } from '../store'

const Sidebar = () => {
  const [editingFile, setEditingFile] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [hoveredFile, setHoveredFile] = useState<string | null>(null)
  
  const { 
    content, 
    setContent, 
    currentDirectory, 
    setCurrentDirectory,
    files,
    setFiles,
    currentFile,
    setCurrentFile,
    isSidebarOpen,
    setIsSidebarOpen
  } = useStore()

  useEffect(() => {
    console.log('Files in store:', files)
  }, [files])

  const getFileName = (filePath: string) => {
    return filePath.split('\\').pop()?.split('/').pop()?.replace('.md', '') || filePath
  }

  const openFolder = async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke('open-folder-dialog')

      if (result && !result.canceled && result.filePaths[0]) {
        const folderPath = result.filePaths[0]
        setCurrentDirectory(folderPath)
        setCurrentFile(null)
        setContent('')
        
        const fullPaths = await window.electron.ipcRenderer.invoke('get-md-files', folderPath)
        setFiles(fullPaths)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const getNextUntitledNumber = () => {
    const untitledFiles = files
      .map(file => {
        const name = getFileName(file);
        if (name === 'Untitled') return 0;
        const match = name.match(/^Untitled_(\d+)$/);
        return match ? parseInt(match[1]) : -1;
      })
      .filter(num => num >= 0)
      .sort((a, b) => a - b);

    if (untitledFiles.length === 0) {
      return null;
    }

    for (let i = 0; i <= untitledFiles.length; i++) {
      if (!untitledFiles.includes(i)) {
        return i;
      }
    }

    return untitledFiles.length;
  };

  const createNewFile = async () => {
    if (!currentDirectory) {
      alert('Please open a folder first')
      return
    }

    try {
      const num = getNextUntitledNumber();
      const fileName = num === null ? 'Untitled' : `Untitled_${num}`;
      const newFilePath = await window.electron.ipcRenderer.invoke('create-new-file', currentDirectory, fileName);
      
      if (newFilePath) {
        const fullPaths = await window.electron.ipcRenderer.invoke('get-md-files', currentDirectory)
        setFiles(fullPaths)
        setCurrentFile(newFilePath)
        setContent('')
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const openFile = async (filePath: string) => {
    try {
      setCurrentFile(filePath)
      const fileContent = await window.electron.ipcRenderer.invoke('read-file', filePath)
      setContent(fileContent || '')
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const deleteFile = async (filePath: string, event: React.MouseEvent) => {
    event.stopPropagation()
    if (confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) {
      try {
        await window.electron.ipcRenderer.invoke('delete-file', filePath)
        setFiles(files.filter(f => f !== filePath))
        if (currentFile === filePath) {
          setCurrentFile(null)
          setContent('')
        }
      } catch (error) {
        console.error('Error:', error)
      }
    }
  }

  const startRenaming = (file: string, event: React.MouseEvent) => {
    event.stopPropagation()
    if (file === currentFile) {
      setEditingFile(file)
      setEditingName(getFileName(file))
    } else {
      openFile(file)
    }
  }

  const handleRenameSubmit = async (filePath: string, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      try {
        const newPath = await window.electron.ipcRenderer.invoke('rename-file', filePath, editingName)
        if (newPath) {
          const fullPaths = await window.electron.ipcRenderer.invoke('get-md-files', currentDirectory)
          setFiles(fullPaths)
          
          if (currentFile === filePath) {
            setCurrentFile(newPath)
          }
        }
      } catch (error) {
        console.error('Error:', error)
      }
      
      setEditingFile(null)
      setEditingName('')
    } else if (event.key === 'Escape') {
      setEditingFile(null)
      setEditingName('')
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    btn.style.setProperty('--x', `${x}px`);
    btn.style.setProperty('--y', `${y}px`);
  };

  const createStyledTooltip = (text: string, rect: DOMRect) => {
    const tooltip = document.createElement('div');
    tooltip.className = `
      fixed px-3 py-1.5 rounded-md whitespace-nowrap z-50
      bg-[var(--bg-secondary)] text-[var(--accent-primary)] text-sm font-medium
      border border-[var(--border-color)]
      overflow-hidden
      shadow-lg
    `;
    
    tooltip.style.cssText = `
      left: ${rect.left + rect.width + 5}px;
      top: ${rect.top + (rect.height / 2)}px;
      transform: translateY(-50%);
      background-image: radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.15), transparent 100px);
    `;
    
    tooltip.id = 'sidebar-tooltip';
    tooltip.textContent = text;
    document.body.appendChild(tooltip);
    return tooltip;
  };

  return (
    <div className="h-full bg-[var(--bg-primary)] overflow-hidden flex flex-col select-none">
      <div className="flex-shrink-0 border-b border-[var(--border-color)] p-2 space-y-1">
        <button
          onClick={createNewFile}
          disabled={!currentDirectory}
          onMouseMove={handleMouseMove}
          onMouseEnter={(e: React.MouseEvent) => {
            if (!isSidebarOpen) {
              createStyledTooltip('New file', e.currentTarget.getBoundingClientRect());
            }
          }}
          onMouseLeave={() => {
            const tooltip = document.getElementById('sidebar-tooltip');
            if (tooltip) tooltip.remove();
          }}
          className={`
            w-full h-9 flex items-center rounded-md
            ${isSidebarOpen ? 'px-3' : 'justify-center'} 
            relative group overflow-hidden
            ${currentDirectory ? '' : 'opacity-50 cursor-not-allowed'}
            bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]/80
            transition-colors duration-300
          `}
          style={{ 
            backgroundImage: 'radial-gradient(circle at var(--x, 0) var(--y, 0), var(--accent-secondary), transparent 100px)'
          }}
        >
          <Plus size={18} className="text-[var(--accent-primary)] flex-shrink-0 relative z-10" />
          {isSidebarOpen && (
            <span className="text-[var(--accent-primary)] ml-2 text-sm font-medium animate-fadeIn relative z-10">
              New File
            </span>
          )}
        </button>
        
        <button
          onClick={openFolder}
          onMouseMove={handleMouseMove}
          onMouseEnter={(e: React.MouseEvent) => {
            if (!isSidebarOpen) {
              createStyledTooltip('Open folder', e.currentTarget.getBoundingClientRect());
            }
          }}
          onMouseLeave={() => {
            const tooltip = document.getElementById('sidebar-tooltip');
            if (tooltip) tooltip.remove();
          }}
          className={`
            w-full h-9 flex items-center rounded-md
            ${isSidebarOpen ? 'px-3' : 'justify-center'} 
            relative group overflow-hidden
            bg-[#1a1b26] hover:bg-[#1a1b26]/80
            transition-colors duration-300
          `}
          style={{ 
            backgroundImage: 'radial-gradient(circle at var(--x, 0) var(--y, 0), rgba(124, 58, 237, 0.15), transparent 100px)'
          }}
        >
          <Folder size={18} className="text-violet-300 flex-shrink-0 relative z-10" />
          {isSidebarOpen && (
            <span className="text-violet-300 ml-2 text-sm font-medium animate-fadeIn relative z-10">
              Open Folder
            </span>
          )}
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {files.map((file) => (
          <div 
            key={file}
            className={`
              relative group h-10 cursor-pointer transition-colors duration-300
              ${currentFile === file ? 
                'bg-[var(--bg-secondary)] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-[var(--accent-primary)]' 
                : 'hover:bg-[var(--bg-secondary)]'
              }
            `}
            onClick={() => openFile(file)}
            onMouseEnter={(e: React.MouseEvent) => {
              setHoveredFile(file);
              if (!isSidebarOpen) {
                createStyledTooltip(getFileName(file), e.currentTarget.getBoundingClientRect());
              }
            }}
            onMouseLeave={() => {
              setHoveredFile(null);
              const tooltip = document.getElementById('sidebar-tooltip');
              if (tooltip) tooltip.remove();
            }}
          >
            {isSidebarOpen ? (
              <div className="absolute inset-0 flex items-center px-4">
                <FileText 
                  size={16} 
                  className={`
                    flex-shrink-0 transition-colors duration-300
                    ${currentFile === file ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)]'}
                  `} 
                />
                {editingFile === file ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => handleRenameSubmit(file, e)}
                    onClick={(e) => e.stopPropagation()}
                    onBlur={() => {
                      setEditingFile(null)
                      setEditingName('')
                    }}
                    className="
                      ml-3 bg-[var(--bg-secondary)] outline-none flex-1
                      text-[var(--accent-primary)] text-sm
                      px-1.5 py-0.5
                      absolute left-9 right-8
                      border-none focus:ring-1 focus:ring-[var(--accent-primary)]/50 rounded-sm
                    "
                    autoFocus
                    spellCheck={false}
                  />
                ) : (
                  <span 
                    className={`
                      ml-3 truncate transition-colors duration-300
                      ${currentFile === file ? 'text-[var(--accent-primary)] font-medium' : 'text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)]'}
                      ${currentFile === file ? 'cursor-text' : 'cursor-default'} 
                    `}
                    onClick={(e) => startRenaming(file, e)}
                  >
                    {getFileName(file)}
                  </span>
                )}
                <button
                  onClick={(e) => deleteFile(file, e)}
                  className="absolute right-2 opacity-0 group-hover:opacity-100 text-[var(--text-secondary)] hover:text-red-400 transition-all"
                >
                  <Trash size={16} />
                </button>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <FileText 
                  size={16} 
                  className={`
                    transition-colors duration-300
                    ${currentFile === file ? 'text-indigo-400' : 'text-gray-400 group-hover:text-indigo-300'}
                  `} 
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Sidebar