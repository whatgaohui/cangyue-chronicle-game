'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';

interface DraggableWindowProps {
  title: string;
  icon?: string;
  onClose: () => void;
  children: React.ReactNode;
  defaultWidth?: number;
  defaultHeight?: number;
  minWidth?: number;
  minHeight?: number;
  className?: string;
}

/**
 * 可拖动、可缩放的游戏窗口组件
 * - 标题栏拖动移动
 * - 右下角拖拽缩放
 * - 记住窗口位置和大小
 */
export default function DraggableWindow({
  title,
  icon,
  onClose,
  children,
  defaultWidth = 400,
  defaultHeight = 500,
  minWidth = 280,
  minHeight = 200,
  className = '',
}: DraggableWindowProps) {
  const [position, setPosition] = useState({ x: -1, y: -1 });
  const [size, setSize] = useState({ width: defaultWidth, height: defaultHeight });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [preMaxState, setPreMaxState] = useState<{ pos: { x: number; y: number }; size: { width: number; height: number } } | null>(null);

  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  // Initialize position to center of screen on first render
  useEffect(() => {
    if (position.x === -1 && position.y === -1) {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setPosition({
        x: Math.max(0, (w - size.width) / 2),
        y: Math.max(0, (h - size.height) / 2),
      });
    }
  }, []);

  // Drag handlers
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  }, [position]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent) => {
      const newX = Math.max(0, Math.min(window.innerWidth - 100, e.clientX - dragOffset.current.x));
      const newY = Math.max(0, Math.min(window.innerHeight - 40, e.clientY - dragOffset.current.y));
      setPosition({ x: newX, y: newY });
    };

    const handleUp = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging]);

  // Resize handlers
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    };
  }, [size]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMove = (e: MouseEvent) => {
      const newWidth = Math.max(minWidth, resizeStart.current.width + (e.clientX - resizeStart.current.x));
      const newHeight = Math.max(minHeight, resizeStart.current.height + (e.clientY - resizeStart.current.y));
      setSize({ width: newWidth, height: newHeight });
    };

    const handleUp = () => setIsResizing(false);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isResizing, minWidth, minHeight]);

  // Maximize toggle
  const handleMaximize = useCallback(() => {
    if (isMaximized && preMaxState) {
      setPosition(preMaxState.pos);
      setSize(preMaxState.size);
      setIsMaximized(false);
    } else {
      setPreMaxState({ pos: position, size });
      setPosition({ x: 0, y: 0 });
      setSize({ width: window.innerWidth, height: window.innerHeight - 4 });
      setIsMaximized(true);
    }
  }, [isMaximized, preMaxState, position, size]);

  const isInteracting = isDragging || isResizing;

  return (
    <div
      ref={windowRef}
      className={`absolute z-30 ${isInteracting ? '' : 'transition-shadow'} ${className}`}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        ...(isMaximized ? { height: size.height } : {}),
      }}
    >
      <div
        className="flex flex-col bg-gray-900/95 backdrop-blur-md rounded-xl border-2 border-amber-600/40 overflow-hidden shadow-2xl"
        style={isMaximized ? { height: size.height } : { maxHeight: size.height }}
      >
        {/* Title bar - draggable */}
        <div
          className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-amber-900/50 to-transparent border-b border-amber-600/30 cursor-move select-none"
          onMouseDown={handleDragStart}
        >
          <h2 className="text-amber-400 font-bold text-sm">
            {icon && <span className="mr-1.5">{icon}</span>}
            {title}
          </h2>
          <div className="flex items-center gap-1">
            {/* Minimize to original size */}
            <button
              onClick={handleMaximize}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-amber-700/50 text-gray-400 hover:text-white transition-colors text-xs"
              title={isMaximized ? '还原' : '最大化'}
            >
              {isMaximized ? '❐' : '☐'}
            </button>
            <button
              onClick={onClose}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-700/50 text-gray-400 hover:text-red-300 transition-colors text-sm"
              title="关闭"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-auto" style={{ maxHeight: isMaximized ? size.height - 44 : size.height - 44 }}>
          {children}
        </div>

        {/* Resize handle */}
        {!isMaximized && (
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
            onMouseDown={handleResizeStart}
            style={{
              background: 'linear-gradient(135deg, transparent 50%, rgba(218, 165, 32, 0.4) 50%)',
            }}
          />
        )}
      </div>
    </div>
  );
}
