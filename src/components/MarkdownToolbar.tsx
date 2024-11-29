import { Bold, Italic, List, Image, Table, ListOrdered, Code, Link, PanelLeftClose, PanelLeftOpen, Columns, Settings, Sun, Moon } from 'lucide-react'
import { useStore } from '../store'
import { useState, useEffect } from 'react'

const MarkdownToolbar = () => {
  const { insertText, setEditorWidth, isDarkMode, setIsDarkMode } = useStore()

  useEffect(() => {
    document.documentElement.classList.toggle('light-mode', !isDarkMode);
  }, [isDarkMode]);

  const createStyledTooltip = (text: string, rect: DOMRect) => {
    const existingTooltips = document.querySelectorAll('[id^="toolbar-tooltip"]');
    existingTooltips.forEach(tooltip => tooltip.remove());

    const tooltip = document.createElement('div');
    tooltip.className = `
      fixed px-3 py-1.5 rounded-md whitespace-nowrap z-50
      bg-[var(--bg-secondary)] text-[var(--accent-primary)] text-sm font-medium
      border border-[var(--border-color)]
      overflow-hidden
      shadow-lg
    `;
    
    const tooltipWidth = text.length * 8 + 24;
    const left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
    
    tooltip.style.cssText = `
      left: ${left}px;
      top: ${rect.bottom + 5}px;
      background-image: radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.15), transparent 100px);
    `;
    
    tooltip.id = `toolbar-tooltip-${Date.now()}`;
    tooltip.textContent = text;
    document.body.appendChild(tooltip);
    return tooltip;
  };

  const tools = [
    { 
      icon: <span className="font-bold">H1</span>, 
      action: () => insertText('\n# ', ''),
      title: 'Heading 1'
    },
    { 
      icon: <span className="font-bold">H2</span>, 
      action: () => insertText('\n## ', ''),
      title: 'Heading 2'
    },
    { 
      icon: <Bold size={18} />, 
      action: () => insertText('**', '**'),
      title: 'Bold'
    },
    { 
      icon: <Italic size={18} />, 
      action: () => insertText('*', '*'),
      title: 'Italic'
    },
    { 
      icon: <List size={18} />, 
      action: () => insertText('\n- ', ''),
      title: 'Bullet list'
    },
    { 
      icon: <ListOrdered size={18} />, 
      action: () => insertText('\n1. ', ''),
      title: 'Numbered list'
    },
    { 
      icon: <Code size={18} />, 
      action: () => insertText('```\n', '\n```'),
      title: 'Code block'
    },
    { 
      icon: <Link size={18} />, 
      action: () => insertText('[', '](url)'),
      title: 'Link'
    },
    { 
      icon: <Image size={18} />, 
      action: () => insertText('![', '](image_url)'),
      title: 'Image'
    },
    { 
      icon: <Table size={18} />, 
      action: () => insertText('\n| Column 1 | Column 2 |\n| --------- | --------- |\n| Cell 1 | Cell 2 |', ''),
      title: 'Table'
    }
  ]

  const layouts = [
    {
      icon: <Columns size={18} />,
      action: () => setEditorWidth(50),
      title: 'Split 50/50'
    },
    {
      icon: <PanelLeftClose size={18} />,
      action: () => setEditorWidth(33),
      title: 'Split 33/67'
    },
    {
      icon: <PanelLeftOpen size={18} />,
      action: () => setEditorWidth(67),
      title: 'Split 67/33'
    }
  ]

  return (
    <div className="h-12 border-b border-[var(--border-color)] bg-[var(--bg-primary)] flex items-center px-4 justify-between">
      <div className="flex items-center">
        <div className="flex gap-2">
          {tools.map((tool, index) => (
            <button
              key={index}
              onClick={tool.action}
              onMouseEnter={(e) => {
                createStyledTooltip(tool.title, e.currentTarget.getBoundingClientRect());
              }}
              onMouseLeave={() => {
                const tooltips = document.querySelectorAll('[id^="toolbar-tooltip"]');
                tooltips.forEach(tooltip => tooltip.remove());
              }}
              className={`
                p-2 rounded-lg transition-colors
                text-[var(--text-secondary)]
                hover:text-[var(--accent-primary)]
                hover:bg-[var(--bg-secondary)]
              `}
            >
              {tool.icon}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-[var(--border-color)] mx-4" />

        <div className="flex gap-2">
          {layouts.map((layout, index) => (
            <button
              key={`layout-${index}`}
              onClick={layout.action}
              onMouseEnter={(e) => {
                createStyledTooltip(layout.title, e.currentTarget.getBoundingClientRect());
              }}
              onMouseLeave={() => {
                const tooltips = document.querySelectorAll('[id^="toolbar-tooltip"]');
                tooltips.forEach(tooltip => tooltip.remove());
              }}
              className={`
                p-2 rounded-lg transition-colors
                text-[var(--text-secondary)]
                hover:text-[var(--accent-primary)]
                hover:bg-[var(--bg-secondary)]
              `}
            >
              {layout.icon}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`
            p-2 rounded-lg transition-colors
            text-[var(--text-secondary)]
            hover:text-[var(--accent-primary)]
            hover:bg-[var(--bg-secondary)]
          `}
          onMouseEnter={(e) => {
            createStyledTooltip(isDarkMode ? "Light mode" : "Dark mode", e.currentTarget.getBoundingClientRect());
          }}
          onMouseLeave={() => {
            const tooltips = document.querySelectorAll('[id^="toolbar-tooltip"]');
            tooltips.forEach(tooltip => tooltip.remove());
          }}
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </div>
  )
}

export default MarkdownToolbar 