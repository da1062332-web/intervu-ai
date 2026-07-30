'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useCalculator } from './useCalculator';
import { useSandboxZIndex } from './useSandboxZIndex';
import { Calculator } from './Calculator';
import { Minus, X, Maximize2, GripHorizontal } from 'lucide-react';

const DEFAULT_WIDTH = 320;
const DEFAULT_HEIGHT = 460;
const MIN_WIDTH = 280;
const MIN_HEIGHT = 380;

export function FloatingCalculator() {
  const {
    isOpen,
    isMinimized,
    position,
    setOpen,
    setMinimized,
    setPosition,
  } = useCalculator();

  const { calculatorZ, bringToFront } = useSandboxZIndex();
  const windowRef = useRef<HTMLDivElement | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number }>({ x: 100, y: 100 });
  const [size, setSize] = useState<{ width: number; height: number }>({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });
  const [isInitializedPos, setIsInitializedPos] = useState(false);

  // Resizing state
  const [isResizing, setIsResizing] = useState<false | 'bottom-right' | 'right' | 'bottom'>(false);
  const resizeRef = useRef<{ startX: number; startY: number; startW: number; startH: number }>({ startX: 0, startY: 0, startW: 0, startH: 0 });

  // Set initial position and size or restore from store
  useEffect(() => {
    if (!isOpen && !isMinimized) return;
    if (position && typeof position.x === 'number' && typeof position.y === 'number') {
      setCurrentPos({ x: position.x, y: position.y });
      if (position.width && position.height) {
        setSize({ width: position.width, height: position.height });
      }
      setIsInitializedPos(true);
    } else if (!isInitializedPos && typeof window !== 'undefined') {
      // Default position at right side under video camera
      const x = Math.max(20, window.innerWidth - DEFAULT_WIDTH - 15);
      const y = 125;
      setCurrentPos({ x, y });
      setIsInitializedPos(true);
    }
  }, [isOpen, isMinimized, position, isInitializedPos]);

  // Constrain to ensure at least 40px of title bar is within viewable desktop screen
  const constrainToViewport = useCallback((x: number, y: number, currentWidth = size.width) => {
    if (typeof window === 'undefined') return { x, y };
    const maxLeft = window.innerWidth - 40;
    const minLeft = -currentWidth + 40;
    const minTop = 0;
    const maxTop = window.innerHeight - 40;

    const clampedX = Math.max(minLeft, Math.min(x, maxLeft));
    const clampedY = Math.max(minTop, Math.min(y, maxTop));
    return { x: clampedX, y: clampedY };
  }, [size.width]);

  useEffect(() => {
    const handleResize = () => {
      setCurrentPos((prev) => {
        const next = constrainToViewport(prev.x, prev.y);
        if (next.x !== prev.x || next.y !== prev.y) {
          setPosition({ ...next, width: size.width, height: size.height }, { width: window.innerWidth, height: window.innerHeight });
        }
        return next;
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [constrainToViewport, setPosition, size.width, size.height]);

  // Drag handlers
  const startDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (isResizing) return;
    bringToFront('calculator');
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragOffset({ x: clientX - currentPos.x, y: clientY - currentPos.y });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const rawX = clientX - dragOffset.x;
      const rawY = clientY - dragOffset.y;
      const constrained = constrainToViewport(rawX, rawY);
      setCurrentPos(constrained);
    };

    const handleEnd = () => {
      setIsDragging(false);
      setPosition({ ...currentPos, width: size.width, height: size.height }, { width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, dragOffset, currentPos, constrainToViewport, setPosition, size.width, size.height]);

  // Border Resizing Logic
  const startResize = (e: React.MouseEvent | React.TouchEvent, mode: 'bottom-right' | 'right' | 'bottom') => {
    e.stopPropagation();
    bringToFront('calculator');
    setIsResizing(mode);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    resizeRef.current = { startX: clientX, startY: clientY, startW: size.width, startH: size.height };
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const deltaX = clientX - resizeRef.current.startX;
      const deltaY = clientY - resizeRef.current.startY;

      let newW = resizeRef.current.startW;
      let newH = resizeRef.current.startH;

      if (isResizing === 'right' || isResizing === 'bottom-right') {
        newW = Math.max(MIN_WIDTH, Math.min(resizeRef.current.startW + deltaX, window.innerWidth - currentPos.x - 10));
      }
      if (isResizing === 'bottom' || isResizing === 'bottom-right') {
        newH = Math.max(MIN_HEIGHT, Math.min(resizeRef.current.startH + deltaY, window.innerHeight - currentPos.y - 10));
      }

      setSize({ width: Math.round(newW), height: Math.round(newH) });
    };

    const handleEnd = () => {
      setIsResizing(false);
      setPosition(
        { ...currentPos, width: size.width, height: size.height },
        { width: window.innerWidth, height: window.innerHeight }
      );
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isResizing, currentPos, size.width, size.height, setPosition]);

  if (!isOpen) return null;

  // Minimized floating chip view
  if (isMinimized) {
    return (
      <button
        onClick={() => {
          setMinimized(false);
          bringToFront('calculator');
        }}
        className='fixed bottom-[74px] right-[130px] z-[950] bg-[#1c3e66] hover:bg-[#142d4a] text-white px-3.5 py-2 rounded-full shadow-lg border border-emerald-400 flex items-center gap-2 font-bold text-xs transition-transform hover:scale-105 active:scale-95 cursor-pointer animate-in fade-in zoom-in-95 duration-150'
        style={{ zIndex: calculatorZ }}
        aria-label='Restore Basic Calculator'
      >
        <span>🧮 Calc</span>
        <Maximize2 className='size-3.5 ml-1 text-emerald-200' />
      </button>
    );
  }

  // Full Calculator Dialog with Border Resizing
  return (
    <div
      ref={windowRef}
      role='dialog'
      aria-label='Basic Calculator'
      className='fixed flex flex-col rounded-lg border border-slate-600 bg-slate-900 shadow-2xl overflow-hidden select-none animate-in zoom-in-95 duration-150'
      style={{
        left: currentPos.x,
        top: currentPos.y,
        width: size.width,
        height: size.height,
        zIndex: calculatorZ,
      }}
      onMouseDown={() => bringToFront('calculator')}
      onTouchStart={() => bringToFront('calculator')}
    >
      {/* Title Bar - Draggable */}
      <div
        onMouseDown={startDrag}
        onTouchStart={startDrag}
        className='flex items-center justify-between px-3 py-2.5 bg-slate-950 text-white cursor-move select-none shrink-0 border-b border-slate-800'
      >
        <div className='flex items-center gap-2 overflow-hidden font-bold text-xs tracking-wide text-slate-200'>
          <GripHorizontal className='size-4 text-emerald-400 shrink-0' />
          <span>🧮 Calculator</span>
        </div>
        <div className='flex items-center gap-1 shrink-0 ml-2'>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMinimized(true);
            }}
            className='p-1 hover:bg-white/15 text-slate-400 hover:text-white rounded transition-colors'
            title='Minimize to floating chip'
            aria-label='Minimize Calculator'
          >
            <Minus className='size-4' />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
            className='p-1 hover:bg-red-600 text-slate-400 hover:text-white rounded transition-colors ml-0.5'
            title='Close (State preserved)'
            aria-label='Close Calculator'
          >
            <X className='size-4' />
          </button>
        </div>
      </div>

      {/* Calculator Engine UI */}
      <div className='flex-1 flex flex-col overflow-hidden pb-1 pr-0.5'>
        <Calculator />
      </div>

      {/* Interactive Border & Corner Resize Handles */}
      {/* Right Edge Resizer */}
      <div
        onMouseDown={(e) => startResize(e, 'right')}
        onTouchStart={(e) => startResize(e, 'right')}
        className='absolute top-0 right-0 w-2 h-full cursor-ew-resize z-[100] hover:bg-emerald-500/20 transition-colors'
        title='Drag horizontally to resize width'
      />
      {/* Bottom Edge Resizer */}
      <div
        onMouseDown={(e) => startResize(e, 'bottom')}
        onTouchStart={(e) => startResize(e, 'bottom')}
        className='absolute bottom-0 left-0 w-full h-2 cursor-ns-resize z-[100] hover:bg-emerald-500/20 transition-colors'
        title='Drag vertically to resize height'
      />
      {/* Bottom-Right Corner Grip Resizer */}
      <div
        onMouseDown={(e) => startResize(e, 'bottom-right')}
        onTouchStart={(e) => startResize(e, 'bottom-right')}
        className='absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize z-[110] flex items-end justify-end p-0.5 bg-slate-800 hover:bg-slate-750 border-t border-l border-slate-700 rounded-tl transition-colors text-slate-400 hover:text-emerald-400 shadow-xs'
        title='Drag corner to resize calculator'
      >
        <svg className='size-3 stroke-current' viewBox='0 0 16 16' fill='none' strokeWidth='2'>
          <line x1='14' y1='6' x2='6' y2='14' />
          <line x1='14' y1='10' x2='10' y2='14' />
        </svg>
      </div>
    </div>
  );
}
