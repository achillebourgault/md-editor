import { Minus, Square, X } from 'lucide-react';
import { useStore } from '../store';

const TitleBar = () => {
  const { currentDirectory, currentFile } = useStore();

  const handleMinimize = () => {
    window.electron.ipcRenderer.send('minimize-window');
  };

  const handleMaximize = () => {
    window.electron.ipcRenderer.send('maximize-window');
  };

  const handleClose = () => {
    window.electron.ipcRenderer.send('close-window');
  };

  const handleTitleClick = () => {
    if (currentDirectory) {
      window.electron.ipcRenderer.send('open-in-explorer', currentDirectory);
    }
  };

  const createStyledTooltip = (text: string, path: string, rect: DOMRect) => {
    const tooltip = document.createElement('div');
    tooltip.className = `
      fixed px-3 py-1.5 rounded-md whitespace-nowrap z-50
      bg-[var(--bg-secondary)] text-[var(--accent-primary)] text-sm font-medium
      border border-[var(--border-color)]
      overflow-hidden
      shadow-lg
    `;
    
    tooltip.style.cssText = `
      left: ${rect.left}px;
      top: ${rect.bottom + 5}px;
      background-image: radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.15), transparent 100px);
    `;
    
    tooltip.id = 'title-tooltip';
    tooltip.innerHTML = `Open in explorer: <span class="text-[var(--text-primary)]">${path}</span>`;
    document.body.appendChild(tooltip);
    return tooltip;
  };

  const folderName = currentDirectory ? window.electron.path.basename(currentDirectory) : null;
  const fileName = currentFile ? window.electron.path.basename(currentFile) : null;

  return (
    <div className="h-8 flex items-center justify-between bg-[var(--bg-primary)] border-b border-[var(--border-color)] select-none" style={{ WebkitAppRegion: 'drag' }}>
      <div className="flex-1 px-4 flex items-center gap-2.5 truncate">
        <span className="font-bold text-[14px] text-[var(--accent-primary)]">MdEditor</span>
        {folderName && (
          <>
            <span className="text-[var(--text-secondary)] text-[12px]">-</span>
            <span 
              className="cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-[12px] flex items-center gap-1.5 app-no-drag"
              onClick={handleTitleClick}
              onMouseEnter={(e) => {
                createStyledTooltip('Open in explorer', currentDirectory, e.currentTarget.getBoundingClientRect());
              }}
              onMouseLeave={() => {
                const tooltip = document.getElementById('title-tooltip');
                if (tooltip) tooltip.remove();
              }}
            >
              <span className="font-semibold">{folderName}</span>
              {fileName && (
                <>
                  <span>/</span>
                  <span>{fileName}</span>
                </>
              )}
            </span>
          </>
        )}
      </div>
      <div className="flex" style={{ WebkitAppRegion: 'no-drag' }}>
        <button
          onClick={handleMinimize}
          className="h-8 w-12 flex items-center justify-center hover:bg-[var(--bg-secondary)] transition-colors"
        >
          <Minus size={16} className="text-[var(--text-secondary)]" />
        </button>
        <button
          onClick={handleMaximize}
          className="h-8 w-12 flex items-center justify-center hover:bg-[var(--bg-secondary)] transition-colors"
        >
          <Square size={14} className="text-[var(--text-secondary)]" />
        </button>
        <button
          onClick={handleClose}
          className="h-8 w-12 flex items-center justify-center hover:bg-red-500 transition-colors group"
        >
          <X size={16} className="text-[var(--text-secondary)] group-hover:text-white" />
        </button>
      </div>
    </div>
  );
};

export default TitleBar; 