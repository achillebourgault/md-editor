import React, { useCallback, KeyboardEvent, useState, MouseEvent, useRef } from 'react';
import { useStore } from '../store';
import { useEffect } from 'react';

const Editor: React.FC = () => {
  const { content, setContent, currentFile, editorWidth, setEditorWidth } = useStore();
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isMouseInTextarea, setIsMouseInTextarea] = useState(false);
  const [isMouseInWindow, setIsMouseInWindow] = useState(false);
  const animationFrameRef = useRef<number>();
  const currentPosRef = useRef({ x: 0, y: 0, size: 300 });
  const targetPosRef = useRef({ x: 0, y: 0, size: 300 });
  const inactivityTimeoutRef = useRef<NodeJS.Timeout>();
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [currentMousePos, setCurrentMousePos] = useState({ x: 0, y: 0 });
  const isEditorScrolling = useRef(false);
  const isPreviewScrolling = useRef(false);
  const isScrolling = useRef(false);

  const startResizing = (e: React.MouseEvent) => {
    setIsResizing(true);
  };

  const stopResizing = () => {
    setIsResizing(false);
  };

  const resize = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const container = textareaRef.current?.closest('.flex');
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const percentage = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    setEditorWidth(Math.max(20, Math.min(80, percentage)));
  }, [isResizing, setEditorWidth]);

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', resize);
      document.addEventListener('mouseup', stopResizing);
    }

    return () => {
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize]);

  const insertText = useCallback((before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end);
    
    setContent(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        end + before.length
      );
    }, 0);
  }, [content, setContent]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!e.ctrlKey) return;

    switch (e.key) {
      case 'b':
        e.preventDefault();
        insertText('**', '**');
        break;
      case 'i':
        e.preventDefault();
        insertText('*', '*');
        break;
      case 'k':
        e.preventDefault();
        insertText('[', '](url)');
        break;
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
        e.preventDefault();
        insertText('#'.repeat(Number(e.key)) + ' ');
        break;
      case 'l':
        e.preventDefault();
        if (e.shiftKey) {
          insertText('1. ');
        } else {
          insertText('- ');
        }
        break;
      case 't':
        e.preventDefault();
        insertText('\n| Header 1 | Header 2 |\n| -------- | -------- |\n| Cell 1   | Cell 2   |\n');
        break;
      case '`':
        e.preventDefault();
        if (e.shiftKey) {
          insertText('\n```\n', '\n```\n');
        } else {
          insertText('`', '`');
        }
        break;
    }
  }, [insertText]);

  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout
    return (...args: any[]) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  }

  const saveContent = async (content: string) => {
    if (!currentFile) return
    
    const { ipcRenderer } = window.require('electron')
    try {
      await ipcRenderer.invoke('save-file', currentFile, content)
    } catch (error) {
      console.error('Error saving file:', error)
    }
  }

  const debouncedSave = debounce(saveContent, 500)

  const handleChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    
    if (currentFile) {
      try {
        await window.electron.ipcRenderer.invoke('save-file', currentFile, newContent);
      } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
      }
    }
  };

  const moveGradient = useCallback(() => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const rect = textarea.getBoundingClientRect();

    const easing = 0.002;

    currentPosRef.current.x += (targetPosRef.current.x - currentPosRef.current.x) * easing;
    currentPosRef.current.y += (targetPosRef.current.y - currentPosRef.current.y) * easing;
    currentPosRef.current.size += (targetPosRef.current.size - currentPosRef.current.size) * easing;

    textarea.style.setProperty('--x', `${currentPosRef.current.x}px`);
    textarea.style.setProperty('--y', `${currentPosRef.current.y}px`);
    textarea.style.setProperty('--size', `${currentPosRef.current.size}px`);

    const distance = Math.hypot(
      targetPosRef.current.x - currentPosRef.current.x,
      targetPosRef.current.y - currentPosRef.current.y
    );

    if (distance < 0.3) {
      generateNewTarget(rect);
    }

    animationFrameRef.current = requestAnimationFrame(moveGradient);
  }, []);

  const handleTextareaMouseMove = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const rect = textarea.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCurrentMousePos({ x, y });
    
    const easing = 0.1;
    const newX = lastMousePos.x + (x - lastMousePos.x) * easing;
    const newY = lastMousePos.y + (y - lastMousePos.y) * easing;
    
    textarea.style.setProperty('--x', `${newX}px`);
    textarea.style.setProperty('--y', `${newY}px`);
    textarea.style.setProperty('--size', '150px');
    
    setLastMousePos({ x: newX, y: newY });
  };

  const handleTextareaMouseLeave = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    setIsMouseInTextarea(false);
    
    const x = e.clientX - e.currentTarget.getBoundingClientRect().left;
    const y = e.clientY - e.currentTarget.getBoundingClientRect().top;
    
    currentPosRef.current = { x, y, size: 300 };
    targetPosRef.current = { x, y, size: 300 };
    
    generateNewTarget(e.currentTarget.getBoundingClientRect());
    moveGradient();
  };

  const handleTextareaMouseEnter = () => {
    setIsMouseInTextarea(true);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (textareaRef.current) {
      const rect = textareaRef.current.getBoundingClientRect();
      const x = rect.width / 2;
      const y = rect.height / 2;
      setLastMousePos({ x, y });
      setCurrentMousePos({ x, y });
    }
  };

  const generateNewTarget = useCallback((rect: DOMRect) => {
    targetPosRef.current = {
      x: Math.random() * rect.width,
      y: Math.random() * rect.height,
      size: Math.random() * (400 - 200) + 200,
    };
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      const rect = textareaRef.current.getBoundingClientRect();
      currentPosRef.current = { x: rect.width / 2, y: rect.height / 2, size: 300 };
      generateNewTarget(rect);
      moveGradient();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [moveGradient, generateNewTarget]);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (isScrolling.current) {
      isScrolling.current = false;
      return;
    }

    const editor = e.currentTarget;
    const preview = document.querySelector('.preview-container');
    if (!preview) return;

    isScrolling.current = true;
    preview.scrollTop = editor.scrollTop;
  };

  useEffect(() => {
    const preview = document.querySelector('.preview-container');
    if (!preview || !textareaRef.current) return;

    const handlePreviewScroll = () => {
      if (isScrolling.current) {
        isScrolling.current = false;
        return;
      }

      const editor = textareaRef.current;
      if (!editor) return;

      isScrolling.current = true;
      editor.scrollTop = preview.scrollTop;
    };

    preview.addEventListener('scroll', handlePreviewScroll);
    return () => preview.removeEventListener('scroll', handlePreviewScroll);
  }, []);

  return (
    <div 
      className="h-full bg-[var(--bg-primary)] text-[var(--text-primary)] relative flex"
      style={{ width: `${editorWidth}%` }}
    >
      {currentFile ? (
        <>
          <div className="flex-1 p-4">
            <div className="relative w-full h-full rounded-md overflow-hidden">
              <textarea
                ref={textareaRef}
                onMouseMove={handleTextareaMouseMove}
                onMouseEnter={handleTextareaMouseEnter}
                onMouseLeave={handleTextareaMouseLeave}
                className={`
                  w-full h-full p-4 font-mono
                  bg-[var(--bg-primary)] text-[var(--text-primary)]
                  resize-none focus:outline-none
                  relative z-10
                  rounded-md
                  border border-[var(--border-color)]
                  transition-colors duration-300
                  custom-scrollbar
                  selection:bg-[var(--accent-secondary)] selection:text-[var(--accent-primary)]
                `}
                style={{
                  backgroundImage: `radial-gradient(circle at var(--x, 0) var(--y, 0), rgba(147, 51, 234, 0.15), transparent var(--size, 300px))`,
                  transition: '--size 0.3s ease-in-out'
                }}
                value={content}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Start writing your markdown here..."
                onScroll={handleScroll}
              />
            </div>
          </div>
          
          <div
            className={`
              w-1 cursor-col-resize 
              hover:w-2 
              bg-[var(--border-color)] 
              hover:bg-[var(--accent-primary)] 
              transition-all
            `}
            onMouseDown={startResizing}
          />
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <p className="text-lg mb-2">No file selected</p>
            <p className="text-sm">Select a file in the sidebar to start editing</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Editor;