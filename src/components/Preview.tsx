import React, { useEffect, useState, useRef } from 'react';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import remarkEmoji from 'remark-emoji';
import path from 'path';
import { useStore } from '../store';

const Preview: React.FC = () => {
  const { content, currentFile, currentDirectory, isDarkMode } = useStore();
  const [parsedHtml, setParsedHtml] = useState('');
  const processTimeoutRef = useRef<NodeJS.Timeout>();
  const { ipcRenderer } = window.electron;

  const processImagePath = async (src: string): Promise<string> => {
    if (src.startsWith('http')) return src;

    try {
      if (src.startsWith('/') || src.startsWith('./')) {
        const basePath = currentDirectory || await ipcRenderer.invoke('get-dirname', currentFile);
        const absolutePath = await ipcRenderer.invoke('resolve-path', 
          basePath,
          src.startsWith('/') ? src.slice(1) : src
        );
        
        const formattedPath = absolutePath
          .replace(/\\/g, '/')
          .replace(/^([A-Za-z]):/, '$1');
        
        return `md-local://${formattedPath}`;
      }
      return src;
    } catch (error) {
      console.error('Error processing image path:', error);
      return src;
    }
  };

  const handleLinkClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const link = target.closest('a');
    
    if (link) {
      const href = link.getAttribute('href');
      
      if (href && !href.startsWith('#')) {
        event.preventDefault();
        window.electron.ipcRenderer.send('open-external-link', href);
      }
    }
  };

  useEffect(() => {
    const processContent = async () => {
      if (processTimeoutRef.current) {
        clearTimeout(processTimeoutRef.current);
      }

      processTimeoutRef.current = setTimeout(async () => {
        try {
          let processedContent = content || '';
          
          const imgRegex = /<img[^>]+src="([^">]+)"[^>]*>/g;
          const imgMatches = [...processedContent.matchAll(imgRegex)];
          
          for (const match of imgMatches) {
            const originalSrc = match[1];
            const newSrc = await processImagePath(originalSrc);
            processedContent = processedContent.replace(
              `src="${originalSrc}"`,
              `src="${newSrc}"`
            );
          }

          const mdImageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
          const mdMatches = [...processedContent.matchAll(mdImageRegex)];
          
          for (const match of mdMatches) {
            const originalSrc = match[2];
            const newSrc = await processImagePath(originalSrc);
            processedContent = processedContent.replace(
              `(${originalSrc})`,
              `(${newSrc})`
            );
          }

          const file = await unified()
            .use(remarkParse)
            .use(remarkGfm)
            .use(remarkMath)
            .use(remarkEmoji)
            .use(remarkRehype, { 
              allowDangerousHtml: true,
              footnoteLabel: 'Footnotes',
              footnoteBackLabel: 'Back to content'
            })
            .use(rehypeKatex)
            .use(rehypeHighlight, {
              ignoreMissing: true,
              detect: true
            })
            .use(rehypeStringify, { allowDangerousHtml: true })
            .process(processedContent);

          setParsedHtml(String(file));
        } catch (error) {
          console.error('Error processing content:', error);
        }
      }, 150);
    };

    processContent();

    return () => {
      if (processTimeoutRef.current) {
        clearTimeout(processTimeoutRef.current);
      }
    };
  }, [content, currentDirectory, currentFile]);

  useEffect(() => {
    const previewContainer = document.querySelector('.preview-container');
    previewContainer?.addEventListener('click', handleLinkClick);

    return () => {
      previewContainer?.removeEventListener('click', handleLinkClick);
    };
  }, []);

  return (
    <div className="h-full w-full bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-y-auto custom-scrollbar preview-container relative">
      <div className="absolute top-3 right-3 z-10">
        <div className="
          px-2.5 h-6 rounded-md 
          bg-[var(--bg-secondary)] 
          text-[var(--accent-primary)] 
          flex items-center justify-center 
          text-[10px] 
          font-semibold 
          tracking-wider 
          relative overflow-hidden
          select-none
        ">
          PREVIEW
        </div>
      </div>
      <div 
        className={`
          prose max-w-none p-8 
          ${isDarkMode ? 'prose-invert' : 'prose-stone'}
          selection:bg-[var(--accent-secondary)] selection:text-[var(--accent-primary)]
          prose-headings:mt-6 prose-headings:mb-4
          prose-h1:mt-0
          prose-p:my-4
          prose-ul:my-4 prose-ul:list-disc
          prose-ol:my-4
          prose-li:my-1
          prose-pre:my-4
          prose-pre:bg-[var(--bg-secondary)]
          prose-pre:border
          prose-pre:border-[var(--border-color)]
          prose-code:text-[var(--accent-primary)]
          prose-code:bg-[var(--bg-secondary)]
          prose-code:px-1.5
          prose-code:py-0.5
          prose-code:rounded-md
          prose-code:before:content-none
          prose-code:after:content-none
          prose-blockquote:my-4
          prose-blockquote:border-l-[var(--accent-primary)]
          prose-blockquote:bg-[var(--bg-secondary)]
          prose-blockquote:rounded-r-lg
          prose-blockquote:py-0.5
          prose-blockquote:pr-4
          prose-thead:border-b-[var(--border-color)]
          prose-tr:border-b-[var(--border-color)]
        `}
        dangerouslySetInnerHTML={{ __html: parsedHtml }}
      />
    </div>
  );
};

export default Preview;