'use client';

import { useState, useRef, useEffect } from 'react';

interface ResizableSidebarProps {
  children: React.ReactNode;
  initialWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  className?: string;
}

export function ResizableSidebar({
  children,
  initialWidth = 300,
  minWidth = 200,
  maxWidth = 600,
  className = '',
}: ResizableSidebarProps) {
  const [width, setWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(initialWidth);

  // Handle mouse down on the resize handle
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
    
    // Add visual indicator that we're resizing
    document.body.classList.add('resizing');
  };

  // Handle resize during mouse move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const delta = e.clientX - startXRef.current;
      const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidthRef.current + delta));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        document.body.classList.remove('resizing');
        
        // Save width to localStorage
        try {
          localStorage.setItem('sidebar-width', width.toString());
        } catch (error) {
          console.error('Error saving sidebar width to localStorage:', error);
        }
      }
    };

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Clean up
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      // Ensure body class is removed when component unmounts
      document.body.classList.remove('resizing');
    };
  }, [isResizing, minWidth, maxWidth, width]);

  // Load width from local storage on initial render
  useEffect(() => {
    try {
      const savedWidth = localStorage.getItem('sidebar-width');
      if (savedWidth) {
        const parsedWidth = parseInt(savedWidth, 10);
        if (!isNaN(parsedWidth) && parsedWidth >= minWidth && parsedWidth <= maxWidth) {
          setWidth(parsedWidth);
        }
      }
    } catch (error) {
      console.error('Error loading sidebar width from localStorage:', error);
    }
  }, [minWidth, maxWidth]);

  return (
    <div
      ref={sidebarRef}
      className={`relative ${className}`}
      style={{ 
        width: `${width}px`, 
        flexShrink: 0
      }}
    >
      {children}
      
      {/* Resize handle */}
      <div
        className="absolute top-0 right-0 h-full w-3 cursor-col-resize z-50"
        style={{
          right: '-6px',
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Visible resize line */}
        <div 
          className={`absolute top-0 left-1/2 transform -translate-x-1/2 h-full transition-all duration-200 ${
            isResizing ? 'bg-blue-500 w-1' : 'bg-gray-300 w-0.5 group-hover:bg-blue-400 group-hover:w-1'
          }`}
        />
      </div>
    </div>
  );
}